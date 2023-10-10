// const { json } = require("express");

const { Client, Account, Databases, ID, Query } = Appwrite;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId)
;

const account = new Account(client);
const database = new Databases(client);

function isLoggedIn() {
    return account.get().then(response => {
        // console.log("response", response);
        if(response) {
            return true;
        }
        return false;
    }).catch(error => console.log("error", error));
}
function getUserId() {
    return account.get().then(response => {
        return response.$id;
    }).catch(error => console.log("error", error));
}

function displayUserName() {
    account.get().then(response => {
        const usernameElem = document.getElementById('username');
        usernameElem.textContent = response.name;
    }).catch(error => console.log("error", error));
}

function updateScore(score) {
    const currentHighscore = document.getElementById('highscore').textContent;
    if(Number(score) > Number(currentHighscore)) {
        getUserId().then(userId => {
            database.updateDocument(
                databaseId,
                collectionId,
                userId,
                {
                    "userId": userId,
                    "highscore": score
                }
            ).then(() => {
                showScore();
            }).then(error => console.log("error", error));
        })
    }
}

function showScore() {
    getUserId().then(userId => {
        console.log("userId", userId);
        database.listDocuments(
            databaseId,
            collectionId,
            [
                Query.equal("userId", userId)
            ]
        ).then(response => {
            const highscoreElem = document.getElementById('highscore')
            highscoreElem.textContent = response.documents[0].highscore;
            // console.log("response highscore", response);
        });
    })
}

document.addEventListener('DOMContentLoaded', () => {
    displayUserName();
    showScore();
})

function register(event) {
    event.preventDefault();
    
    account.create(
        ID.unique(),
        event.target.elements['register-email'].value,
        event.target.elements['register-password'].value,
        event.target.elements['register-username'].value
    ).then(response => {
        console.log("Account create response", response);

        database.createDocument(
            databaseId, 
            collectionId,
            response.$id, // document id is the same as user id
            {
                "userId": response.$id,
                "highscore": 0
            }
        );

        account.createEmailSession(
            event.target.elements['register-email'].value,
            event.target.elements['register-password'].value
        ).then(() => {
            showDisplay();
            displayUserName();
        })

    }).catch(error => console.error("Account create error", error));
}

function login(event) {
    event.preventDefault();
    console.log("login event", event);
    account.createEmailSession(
        event.target.elements['login-email'].value,
        event.target.elements['login-password'].value
    ).then(() => {
        alert('Session created successfully!');
        showDisplay();
        displayUserName();
        client.subscribe("account", (response) => {
            console.log("response", response);
        });
    }).catch(error => {
        alert("Failed to create session");
        console.log("error", error);
    });
}

function logout() {
    account.deleteSessions().then(() => {
        alert('Logged out');
        console.log('Current session deleted');
        showDisplay();
        const highscoreElem = document.getElementById('highscore');
        highscoreElem.textContent = "";
    }).catch(error => console.log("error", error));
}

function toggleModal(event) {
    const registerFormElem = document.getElementById('register-form');
    const loginFormElem = document.getElementById('login-form');
    const registerButtonElem = document.getElementById('register-button');
    const loginButtonElem = document.getElementById('login-button');

    if(event.srcElement.id ==='register-button') {
        registerFormElem.classList.remove('hidden');
        loginFormElem.classList.add('hidden');
        loginButtonElem.classList.add('not-active');
        registerButtonElem.classList.remove('not-active');
    }
    if(event.srcElement.id ==='login-button') {
        registerFormElem.classList.add('hidden');
        loginFormElem.classList.remove('hidden');
        loginButtonElem.classList.remove('not-active');
        registerButtonElem.classList.add('not-active');
    }
}

function showDisplay() {
    const modalElem = document.getElementById('modal');
    modalElem.classList.add('hidden');
    isLoggedIn().then(isLogin => {
        if(isLogin) {
            const modalElem = document.getElementById('modal');
            modalElem.classList.add('hidden');
            const logoutButtonElem = document.getElementById('logout-button');
            logoutButtonElem.classList.remove('hidden');
            const highscoreTagElem = document.getElementById('highscore-tag');
            highscoreTagElem.classList.remove('hidden');
            startGame();
        } else {
            const modalElem = document.getElementById('modal');
            modalElem.classList.remove('hidden');
            const logoutButtonElem = document.getElementById('logout-button');
            logoutButtonElem.classList.add('hidden');
            const highscoreTagElem = document.getElementById('highscore-tag');
            highscoreTagElem.classList.add('hidden');

            const usernameElem = document.getElementById('username');
            usernameElem.textContent = "";
            const canvasElem = document.querySelector('canvas');
            if(canvasElem) {
                canvasElem.remove();
            }
        }
    }).catch(error => console.log("error", error))
}

showDisplay();


// Kaboom game
function startGame() {
    kaboom({
        global: true,
        fullscreen: true,
        scale: 3,
        clearColor: [0,0,0,1]
    });

    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;

    let isJumping = true;


    loadRoot("assets/");
    loadSprite("doux", "sprites/DinoSprites_doux.gif", {
        sliceX: 24,
        sliceY: 0,
        anims: {
            idle: {
                from: 0,
                to: 2,
                speed: 6,
                loop: true
            },
            run: {
                from: 3,
                to: 9,
                speed: 12,
                loop: true
            },
            kick: {
                from: 10, 
                to: 12,
                speed: 6,
                loop: false
            },
            hurt: {
                from: 13,
                to: 16,
                speed: 8,
                loop: false
            },
            sneak: {
                from: 17,
                to: 23,
                speed: 14,
                loop: true
            },
            jump: 21
        },
    });
    loadSprite("grass", "sprites/nature-platformer-tileset-16x16.png", {
        sliceX: 7,
        sliceY: 11,
        // area: {vec2: [16, 0], vec2: [32, 16]}
        // area: {
        //     x: 16,
        //     y: 0,
        //     width: 16,
        //     height: 16,
        // }
    });
    

    scene("game", ({ level, score }) => {
        layers(["bg", "obj", "ui"], "obj");
        // gravity(0);

        const levelConfig = {
            width: 16,
            height: 16,
            '(' : [ sprite('grass'),                   solid(), {frame:0} ],
            '=' : [ sprite('grass'),                   solid(), {frame:1} ],
            ')' : [ sprite('grass'),                   solid(), {frame:2} ],

            '{' : [ sprite('grass'),                   solid(), {frame:3} ],
            '~' : [ sprite('grass'),                   solid(), {frame:4} ],
            '}' : [ sprite('grass'),                   solid(), {frame:5} ],

            '[' : [ sprite('grass'),                   solid(), {frame:7} ],
            '-' : [ sprite('grass'),                   solid(), {frame:8} ],
            ']' : [ sprite('grass'),                   solid(), {frame:9} ],
            // '$' : [ sprite('coin'),                                     'coin' ],
            // '%' : [ sprite('surprise'),             solid(),            'coin-surprise' ],
            // '*' : [ sprite('surprise'),             solid(),            'mushroom-surprise' ],
            // '}' : [ sprite('unboxed'),              solid() ],
            // '(' : [ sprite('pipe-bottom-left'),     solid(), scale(0.5) ],
            // ')' : [ sprite('pipe-bottom-right'),    solid(), scale(0.5) ],
            // '-' : [ sprite('pipe-top-left'),        solid(), scale(0.5), 'pipe' ],
            // '+' : [ sprite('pipe-top-right'),       solid(), scale(0.5), 'pipe' ],
            // '^' : [ sprite('evil-shroom'),                               'dangerous', body() ],
            // '#' : [ sprite('mushroom'),             solid(),             'mushroom', body() ],
        }
        
        const gameLevel = addLevel(maps[level], levelConfig);

        const scoreLabel = add([
            text(score),
            pos(10, 6),
            layer('ui'),
            {
                value: score
            }
        ]);

        add([
            text(' level ' + parseInt(level + 1)),
            pos(40, 6)
        ]);

        const dino = add([
            sprite("doux", solid()),
            pos(33, height()/3),
            body(),
            area(vec2(-7, -4), vec2(7, -16)),
            // big(),
            origin('bot'),
            {
                width: 16,
                height: 16
            }
        ]);
        console.log("dino", dino, dino.numFrames());
        dino.play("idle");
        
        // function big() {
        //     let timer = 0;
        //     let isBig = false;
        //     return {
        //         update() {
        //             if(isBig) {
        //                 currentJumpForce = bigJumpForce;
        //                 timer -= dt();
        //                 if(timer <= 0) {
        //                     this.smallify();
        //                 }
        //             }
        //         },
        //         isBig() {
        //             return isBig;
        //         },
        //         smallify() {
        //             this.scale = vec2(1);
        //             currentJumpForce = jumpForce;
        //             timer = 0;
        //             isBig = false;
        //         },
        //         biggify(time) {
        //             this.scale = vec2(2);
        //             timer = time;
        //             isBig = true;

        //         }
        //     }
        // }

        // dino.collides('pipe', () => {
        //     keyPress('s', () => {
        //         go('game', {
        //             level: (level + 1) % maps.length,
        //             score: scoreLabel.value
        //         })
        //     })
        // })
        // dino.collides('dangerous', (danger) => {
        //     if(isJumping) {
        //         destroy(danger);
        //     } else {
        //         go('lose', {score: scoreLabel.value});
        //     }
        // });
        // dino.collides('coin', (coin) => {
        //     destroy(coin);
        //     scoreLabel.value++;
        //     scoreLabel.text = scoreLabel.value;
        // });
        // dino.on('headbump', (object) => {
        //     if(object.is('coin-surprise')) {
        //         gameLevel.spawn('$', object.gridPos.sub(0,1));
        //         destroy(object);
        //         gameLevel.spawn('}', object.gridPos.add(0,0));
        //     } else if(object.is('mushroom-surprise')) {
        //         gameLevel.spawn('#', object.gridPos.sub(0,1));
        //         destroy(object);
        //         gameLevel.spawn('}', object.gridPos.add(0,0));
        //     }
        // });
        // dino.collides('mushroom', (mushroom) => {
        //     destroy(mushroom);
        //     dino.biggify(6);
        // });

        // dino.action(() => {
        //     if(dino.grounded()) {
        //         isJumping = false;
        //     }
        // });
        dino.action(() => {
            camPos(dino.pos);
            if(dino.pos.y >= fallDeath){
                go('lose', {score: scoreLabel.value})
            }
        });

        // action('dangerous', (danger) => {
        //     danger.move(-enemySpeed, 0);
        // })
        // action('mushroom', (mushroom) => {
        //     mushroom.move(20, 0);
        // })


        keyDown('a', () => {
            dino.move(-moveSpeed, 0);
            // dino.play("run");
        });
        keyDown('d', () => {
            dino.move(moveSpeed, 0);
            // dino.play("run");
        });
        keyDown('left', () => {
            dino.move(-moveSpeed, 0);
            // dino.play("run");
        });
        keyDown('right', () => {
            dino.move(moveSpeed, 0);
            // dino.play("run");
        });
        keyPress('space', () => {
            if(dino.grounded()) {
                isJumping = true;
                dino.jump(currentJumpForce);
                dino.play("jump");    
            }
        });


        scene('lose', ({score}) => {
            add([ text(score, 32), origin('center'), pos(width()/2, height()/2) ]);
            updateScore(score);
        })

    })

    start("game", { level: 0, score: 0 });
}