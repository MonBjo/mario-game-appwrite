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
        clearColor: [0.2,0.2,0.2,0.8]
    });

    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;

    let isJumping = true;


    loadRoot("assets/");
    loadSprite("doux", "sprites/DinoSprites-doux.png", {
        sliceX: 24,
        sliceY: 0,
        anims: {
            idle: {
                from: 0,
                to: 2,
                speed: 12,
                loop: true
            },
            run: {
                from: 3,
                to: 9,
                speed: 24,
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
                speed: 16,
                loop: false
            },
            sneak: {
                from: 17,
                to: 23,
                speed: 14,
                loop: true
            },
            jump: {
                from: 21,
                to: 21
            }
        },
    });
    loadSprite("tiles", "sprites/nature-platformer-tileset-16x16.png", {
        sliceX: 7,
        sliceY: 11,
    });

    scene("game", ({ level, score }) => {
        layers(["bg", "obj", "ui"], "obj");
        // gravity(0);

        const levelConfig = {
            width: 15,
            height: 15,
            // Dirt top
            '(' : [ sprite('tiles'), solid(), {frame:0} ],
            '0' : [ sprite('tiles'), solid(), {frame:1} ],
            ')' : [ sprite('tiles'), solid(), {frame:2} ],
            // Dirt middle
            '[' : [ sprite('tiles'), solid(), {frame:7} ],
            '1' : [ sprite('tiles'), solid(), {frame:8} ],
            ']' : [ sprite('tiles'), solid(), {frame:9} ],
            // Dirt bottom
            '<' : [ sprite('tiles'), solid(), {frame:14} ],
            '2' : [ sprite('tiles'), solid(), {frame:15} ],
            '>' : [ sprite('tiles'), solid(), {frame:16} ],
            // Dirt floor
            'A' : [ sprite('tiles'), solid(), {frame:3} ],
            '3' : [ sprite('tiles'), solid(), {frame:4} ],
            'a' : [ sprite('tiles'), solid(), {frame:5} ],
            // Brick wall
            'B' : [ sprite('tiles'), solid(), {frame:6} ],
            '4' : [ sprite('tiles'), solid(), {frame:13} ],
            'b' : [ sprite('tiles'), solid(), {frame:20} ],
            // Brick floor
            'C' : [ sprite('tiles'), solid(), {frame:42} ],
            '5' : [ sprite('tiles'), solid(), {frame:43} ],
            'c' : [ sprite('tiles'), solid(), {frame:44} ],
            // Brick top
            ',' : [ sprite('tiles'), solid(), {frame:17} ],
            '6' : [ sprite('tiles'), solid(), {frame:18} ],
            '.' : [ sprite('tiles'), solid(), {frame:19} ],
            // Brick middle
            ';' : [ sprite('tiles'), solid(), {frame:24} ],
            '7' : [ sprite('tiles'), solid(), {frame:25} ],
            ':' : [ sprite('tiles'), solid(), {frame:26} ],
            // Brick bottom
            '¤' : [ sprite('tiles'), solid(), {frame:31} ],
            '8' : [ sprite('tiles'), solid(), {frame:32} ],
            '#' : [ sprite('tiles'), solid(), {frame:33} ],
            // Brick smooth
            'H' : [ sprite('tiles'), solid(), {frame:34} ],
            'h' : [ sprite('tiles'), solid(), {frame:41} ],
            // Ladder
            'D' : [ sprite('tiles'), solid(), {frame:21} ],
            '9' : [ sprite('tiles'), solid(), {frame:28} ],
            'd' : [ sprite('tiles'), solid(), {frame:35} ],
            // Tall plant
            'E' : [ sprite('tiles'), solid(), {frame:22} ],
            '!' : [ sprite('tiles'), solid(), {frame:29} ],
            'e' : [ sprite('tiles'), solid(), {frame:36} ],
            // Tree top
            'F' : [ sprite('tiles'), solid(), {frame:23} ],
            '?' : [ sprite('tiles'), solid(), {frame:30} ],
            // Tree bottom
            'f' : [ sprite('tiles'), solid(), {frame:37} ],
            'g' : [ sprite('tiles'), solid(), {frame:38} ],
            'G' : [ sprite('tiles'), solid(), {frame:39} ],
            // Coins
            'I' : [ sprite('tiles'), {frame:54}, 'coin' ],
            'i' : [ sprite('tiles'), {frame:55}, 'coin' ],
            'J' : [ sprite('tiles'), {frame:61}, 'coin' ],
            'j' : [ sprite('tiles'), {frame:62}, 'coin' ],
            // Potions
            'M' : [ sprite('tiles'), {frame:56} ],
            'm' : [ sprite('tiles'), {frame:57} ],
            'N' : [ sprite('tiles'), {frame:63} ],
            'n' : [ sprite('tiles'), {frame:64} ],
            // Clouds big corner
            'P' : [ sprite('tiles'),  {frame:51} ],
            'p' : [ sprite('tiles'),  {frame:52} ],
            'Q' : [ sprite('tiles'),  {frame:58} ],
            'q' : [ sprite('tiles'),  {frame:59} ],
            // Clouds small corner
            'R' : [ sprite('tiles'),  {frame:65} ],
            'r' : [ sprite('tiles'),  {frame:66} ],
            'S' : [ sprite('tiles'),  {frame:72} ],
            's' : [ sprite('tiles'),  {frame:73} ],
            // Clouds double corner
            'T' : [ sprite('tiles'),  {frame:53} ],
            't' : [ sprite('tiles'), {frame:67} ],
            // Clouds solid color
            'U' : [ sprite('tiles'), {frame:60} ],
            'u' : [ sprite('tiles'), {frame:74} ],
            // Plants
            'K' : [ sprite('tiles'), {frame:45} ],
            'k' : [ sprite('tiles'), {frame:48} ],
            // Stones
            'L' : [ sprite('tiles'),  {frame:46} ],
            'l' : [ sprite('tiles'),  {frame:47} ],
            // Trapdoor or wooden crate or closed window or whatever
            'O' : [ sprite('tiles'), solid(), {frame:49} ],
            'o' : [ sprite('tiles'), solid(), {frame:50} ], 

            'v' : [ sprite('tiles'), solid(), {frame:10} ], // Single dirt block
            'w' : [ sprite('tiles'), solid(), {frame:27} ], // single brick block
            'x' : [ sprite('tiles'),  {frame:11}, 'portal' ], // Dirt cave
            'y' : [ sprite('tiles'),  {frame:40}, 'water' ], // Water

            // '@' : [ sprite('name'), solid(), scale(1), body(),'tag','tags', {frame:0} ]
        }
        
        const gameLevel = addLevel(maps[level], levelConfig);

        const scoreLabel = add([
            text('Gems ' + score),
            pos(100, 6),
            layer('ui'),
            {
                value: score
            }
        ]);

        add([
            text(' Level ' + parseInt(level + 1)),
            pos(10, 6)
        ]);

        const dino = add([
            sprite("doux", solid()),
            pos(25, height()/4),
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

        dino.collides('portal', () => {
            keyPress('s', () => {
                go('game', {
                    level: (level + 1) % maps.length,
                    score: scoreLabel.value
                })
            })
        });
        // dino.collides('dangerous', (danger) => {
        //     if(isJumping) {
        //         destroy(danger);
        //     } else {
        //         go('lose', {score: scoreLabel.value});
        //     }
        // });
        dino.collides('coin', (coin) => {
            destroy(coin);
            scoreLabel.value++;
            scoreLabel.text = 'Gems ' + scoreLabel.value;

            // It's a start
            const highscoreElem = document.getElementById('highscore')
            highscoreElem.textContent += 'Gems ' + scoreLabel.value;
        });
        dino.collides('water', () => {
            wait(0.05, () => {
                isJumping = true;
                dino.jump(currentJumpForce*1.5);
                dino.play("hurt");  
            });
        })
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

        dino.action(() => {
            if(dino.grounded()) {
                isJumping = false;
            }
        });
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
            dino.play("run");
        });
        keyDown('d', () => {
            dino.move(moveSpeed, 0);
            dino.play("run");
        });
        keyDown('s',() => {
            dino.play("sneak");
        });
        keyPress('space', () => {
            if(dino.grounded()) {
                isJumping = true;
                dino.jump(currentJumpForce);
                dino.play("jump");    
            }
        });
        keyRelease(['a', 'd', 's', 'space'], () => {
            dino.play("idle");
        });


        scene('lose', ({score}) => {
            add([ text(score, 32), origin('center'), pos(width()/2, height()/2) ]);
            updateScore(score);
        })

    })

    start("game", { level: 0, score: 0 });
}