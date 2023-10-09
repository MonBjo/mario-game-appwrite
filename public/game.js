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
        scale: 2,
        clearColor: [0,0,0,1]
    });

    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;

    let isJumping = true;
    
    
    // https://imgur.com/a/F8Jkryq
    loadRoot('https://i.imgur.com/');
    loadSprite('coin',              'wbKxhcd.png');
    loadSprite('evil-shroom',       'KPO3fR9.png');
    loadSprite('brick',             'pogC9x5.png');
    loadSprite('block',             'M6rwarW.png');
    loadSprite('mario',             'Wb1qfhK.png');
    loadSprite('mushroom',          '0wMd92p.png');
    loadSprite('surprise',          'gesQ1KP.png');
    loadSprite('unboxed',           'bdrLpi6.png');
    loadSprite('pipe-top-left',     'ReTPiWY.png');
    loadSprite('pipe-top-right',    'hj2GK4n.png');
    loadSprite('pipe-bottom-left',  'c1cYSbt.png');
    loadSprite('pipe-bottom-right', 'nqQ79eI.png');
    loadSprite('blue-block',        'fVscIbn.png');
    loadSprite('blue-brick',        '3e5YRQd.png');
    loadSprite('blue-steel',        'gqVoI2b.png');
    loadSprite('blue-evil-shroom',  'SvV4ueD.png');
    loadSprite('blue-surprise',     'RMqCc1G.png');
    // loadSprite('','.png');

    scene("game", ({ level, score }) => {
        layers(["bg", "obj", "ui"], "obj");


        const levelConfig = {
            width: 20,
            height: 20,
            '=' : [ sprite('block'),                solid() ],
            '$' : [ sprite('coin'),                                     'coin' ],
            '%' : [ sprite('surprise'),             solid(),            'coin-surprise' ],
            '*' : [ sprite('surprise'),             solid(),            'mushroom-surprise' ],
            '}' : [ sprite('unboxed'),              solid() ],
            '(' : [ sprite('pipe-bottom-left'),     solid(), scale(0.5) ],
            ')' : [ sprite('pipe-bottom-right'),    solid(), scale(0.5) ],
            '-' : [ sprite('pipe-top-left'),        solid(), scale(0.5), 'pipe' ],
            '+' : [ sprite('pipe-top-right'),       solid(), scale(0.5), 'pipe' ],
            '^' : [ sprite('evil-shroom'),                               'dangerous', body() ],
            '#' : [ sprite('mushroom'),             solid(),             'mushroom', body() ],
            '!' : [ sprite('blue-block'),           solid(), scale(0.5) ],
            '£' : [ sprite('blue-brick'),           solid(), scale(0.5) ],
            'z' : [ sprite('blue-evil-shroom'),              scale(0.5), 'dangerous', body() ],
            '@' : [ sprite('blue-surprise'),        solid(), scale(0.5), 'coin-surprise' ],
            'x' : [ sprite('blue-steel'),           solid(), scale(0.5), ],
            // '' : [ sprite(''), '' ]
        }

        
        const gameLevel = addLevel(maps[level], levelConfig);

        const scoreLabel = add([
            text(score),
            pos(30, 6),
            layer('ui'),
            {
                value: score
            }
        ]);

        add([
            text(' level ' + parseInt(level + 1)),
            pos(40, 6)
        ]);


        const player = add([
            sprite('mario', solid()),
            pos(30, 0),
            body(),
            big(),
            origin('bot')
        ]);

        function big() {
            let timer = 0;
            let isBig = false;
            return {
                update() {
                    if(isBig) {
                        currentJumpForce = bigJumpForce;
                        timer -= dt();
                        if(timer <= 0) {
                            this.smallify();
                        }
                    }
                },
                isBig() {
                    return isBig;
                },
                smallify() {
                    this.scale = vec2(1);
                    currentJumpForce = jumpForce;
                    timer = 0;
                    isBig = false;
                },
                biggify(time) {
                    this.scale = vec2(2);
                    timer = time;
                    isBig = true;

                }
            }
        }

        player.collides('pipe', () => {
            keyPress('s', () => {
                go('game', {
                    level: (level + 1) % maps.length,
                    score: scoreLabel.value
                })
            })
        })
        player.collides('dangerous', (danger) => {
            if(isJumping) {
                destroy(danger);
            } else {
                go('lose', {score: scoreLabel.value});
            }
        });
        player.collides('coin', (coin) => {
            destroy(coin);
            scoreLabel.value++;
            scoreLabel.text = scoreLabel.value;
        });
        player.on('headbump', (object) => {
            if(object.is('coin-surprise')) {
                gameLevel.spawn('$', object.gridPos.sub(0,1));
                destroy(object);
                gameLevel.spawn('}', object.gridPos.add(0,0));
            } else if(object.is('mushroom-surprise')) {
                gameLevel.spawn('#', object.gridPos.sub(0,1));
                destroy(object);
                gameLevel.spawn('}', object.gridPos.add(0,0));
            }
        });
        player.collides('mushroom', (mushroom) => {
            destroy(mushroom);
            player.biggify(6);
        });

        player.action(() => {
            if(player.grounded()) {
                isJumping = false;
            }
        });
        player.action(() => {
            camPos(player.pos);
            if(player.pos.y >= fallDeath){
                go('lose', {score: scoreLabel.value})
            }
        });

        action('dangerous', (danger) => {
            danger.move(-enemySpeed, 0);
        })
        action('mushroom', (mushroom) => {
            mushroom.move(20, 0);
        })


        keyDown('a', () => player.move(-moveSpeed, 0));
        keyDown('d', () => player.move(moveSpeed, 0));
        keyDown('left', () => player.move(-moveSpeed, 0));
        keyDown('right', () => player.move(moveSpeed, 0));
        keyPress('space', () => {
            if(player.grounded()) {
                isJumping = true;
                player.jump(currentJumpForce);
            }
        });


        scene('lose', ({score}) => {
            add([ text(score, 32), origin('center'), pos(width()/2, height()/2) ]);
            updateScore(score);
        })

    })

    start("game", { level: 0, score: 0 });
}