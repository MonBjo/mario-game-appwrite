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

function updateHighscore(score) {
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
        console.log("isLogin", isLogin);
        if(isLogin) {
            const modalElem = document.getElementById('modal');
            modalElem.classList.add('hidden');
            const logoutButtonElem = document.getElementById('logout-button');
            logoutButtonElem.classList.remove('hidden');
            const gameInfoElems = document.querySelectorAll('.gameInfo');
            console.log(gameInfoElems);
            for(let elem of gameInfoElems){
                elem.classList.remove('hidden');
            }

            startGame();
        } else {
            const modalElem = document.getElementById('modal');
            modalElem.classList.remove('hidden');
            const logoutButtonElem = document.getElementById('logout-button');
            logoutButtonElem.classList.add('hidden');
            const gameInfoElems = document.querySelectorAll('gameInfo');
            for(let elem of gameInfoElems){
                elem.classList.add('hidden');
            }

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
    
    let scoreLabel = 0;

    // TODO: When sneaking one frame has bigger pupils than the others

    // loadRoot("../assets/");
    loadSpriteAtlas("../assets/sprites/DinoSprites-doux.png", {
        "doux": {
            x: 1,
            y: 1,
            width: 575,
            height: 23,
            sliceX: 24,
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
                    speed: 14,
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
                jump: {
                    from: 21,
                    to: 21
                }
            },
        }
    });
    loadSpriteAtlas("../assets/sprites/nature-platformer-tileset-16x16.png", {
        x: 0,
        y: 0,
        sliceX: 7,
        sliceY: 11,
        "dirt-top-left": {
            "x": 0,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "dirt-top-center": {
            "x": 16,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "dirt-top-right": {
            "x": 32,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "dirt-middle-left": {
            "x": 0,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "dirt-middle-center": {
            "x": 16,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "dirt-middle-right": {
            "x": 32,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "dirt-bottom-left": {
            "x": 0,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "dirt-bottom-center": {
            "x": 16,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "dirt-bottom-right": {
            "x": 32,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "dirt-floor-left": {
            "x": 48,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "dirt-floor-center": {
            "x": 64,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "dirt-floor-right": {
            "x": 80,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "brick-wall-top": {
            "x": 96,
            "y": 0,
            "width": 16,
            "height": 16
        },
        "brick-wall-middle": {
            "x": 96,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "brick-wall-bottom": {
            "x": 96,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "brick-floor-left": {
            "x": 0,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "brick-floor-center": {
            "x": 16,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "brick-floor-right": {
            "x": 32,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "brick-top-left": {
            "x": 48,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "brick-top-center": {
            "x": 64,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "brick-top-right": {
            "x": 80,
            "y": 32,
            "width": 16,
            "height": 16
        },
        "brick-middle-left": {
            "x": 48,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "brick-middle-center": {
            "x": 64,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "brick-middle-right": {
            "x": 80,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "brick-bottom-left": {
            "x": 48,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "brick-bottom-center": {
            "x": 64,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "brick-bottom-right": {
            "x": 80,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "brick-smooth-cracked": {
            "x": 96,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "brick-smooth": {
            "x": 96,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "ladder-top": {
            "x": 0,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "ladder-middle": {
            "x": 0,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "ladder-bottom": {
            "x": 0,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "tall-plant-top": {
            "x": 16,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "tall-plant-middle": {
            "x": 16,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "tall-plant-bottom": {
            "x": 16,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "tree-top": {
            "x": 32,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "tree-middle": {
            "x": 32,
            "y": 64,
            "width": 16,
            "height": 16
        },
        "tree-bottom": {
            "x": 32,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "tree-bottom-variant1": {
            "x": 48,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "tree-bottom-variant2": {
            "x": 64,
            "y": 80,
            "width": 16,
            "height": 16
        },
        "coin-yellow": {
            "x": 80,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "coin-red": {
            "x": 96,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "coin-blue": {
            "x": 80,
            "y": 128,
            "width": 16,
            "height": 16
        },
        "coin-green": {
            "x": 96,
            "y": 128,
            "width": 16,
            "height": 16
        },
        "potion-green": {
            "x": 0,
            "y": 128,
            "width": 16,
            "height": 16
        },
        "potion-red": {
            "x": 16,
            "y": 128,
            "width": 16,
            "height": 16
        },
        "potion-brown": {
            "x": 0,
            "y": 144,
            "width": 16,
            "height": 16
        },
        "potion-yellow": {
            "x": 16,
            "y": 144,
            "width": 16,
            "height": 16
        },
        "cloud-big-top-left": {
            "x": 32,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "cloud-big-top-right": {
            "x": 48,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "cloud-big-bottom-left": {
            "x": 32,
            "y": 118,
            "width": 16,
            "height": 16
        },
        "cloud-big-bottom-right": {
            "x": 48,
            "y": 118,
            "width": 16,
            "height": 16
        },
        "cloud-small-top-left": {
            "x": 32,
            "y": 134,
            "width": 16,
            "height": 16
        },
        "cloud-small-top-right": {
            "x": 48,
            "y": 134,
            "width": 16,
            "height": 16
        },
        "cloud-small-bottom-left": {
            "x": 32,
            "y": 150,
            "width": 16,
            "height": 16
        },
        "cloud-small-bottom-right": {
            "x": 48,
            "y": 150,
            "width": 16,
            "height": 16
        },
        "cloud-doublecorner-top": {
            "x": 64,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "cloud-doublecorner-bottom": {
            "x": 64,
            "y": 128,
            "width": 16,
            "height": 16
        },
        "cloud-solid": {
            "x": 64,
            "y": 144,
            "width": 16,
            "height": 16
        },
        "sky-solid": {
            "x": 64,
            "y": 160,
            "width": 16,
            "height": 16
        },
        "flower-small": {
            "x": 48,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "flower-big": {
            "x": 64,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "rock-small": {
            "x": 80,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "rock-big": {
            "x": 96,
            "y": 96,
            "width": 16,
            "height": 16
        },
        "wood-horizontal": {
            "x": 0,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "wood-vertical": {
            "x": 16,
            "y": 112,
            "width": 16,
            "height": 16
        },
        "single-dirt-block": {
            "x": 48,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "single-brick-block": {
            "x": 96,
            "y": 48,
            "width": 16,
            "height": 16
        },
        "dirt-cave": {
            "x": 64,
            "y": 16,
            "width": 16,
            "height": 16
        },
        "water": {
            "x": 80,
            "y": 80,
            "width": 16,
            "height": 16
        }
    });

    scene("game", ({ level, score }) => {
        // layers(["bg", "obj", "ui"], "obj");
        setGravity(1000);

        console.log("score at scene() start: ", score);


        const levelConfig = {
            tileWidth: 16,
            tileHeight: 16,
            tiles: {
                // Dirt top 
                '(' : () => [ sprite('dirt-top-left'), area(), body({ isStatic: true }), ],
                '0' : () => [ sprite('dirt-top-center'), area(), body({ isStatic: true }), ],
                ')' : () => [ sprite('dirt-top-right'), area(), body({ isStatic: true }) ],
                // Dirt middle
                '[' : () => [ sprite('dirt-middle-left'), area(), body({ isStatic: true }) ],
                '1' : () => [ sprite('dirt-middle-center'), area(), body({ isStatic: true }) ],
                ']' : () => [ sprite('dirt-middle-right'), area(), body({ isStatic: true }) ],
                // Dirt bottom
                '<' : () => [ sprite('dirt-bottom-left'), area(), body({ isStatic: true }) ],
                '2' : () => [ sprite('dirt-bottom-center'), area(), body({ isStatic: true }) ],
                '>' : () => [ sprite('dirt-bottom-right'), area(), body({ isStatic: true }) ],
                // Dirt floor
                'A' : () => [ sprite('dirt-floor-left'), area(), body({ isStatic: true }) ],
                '3' : () => [ sprite('dirt-floor-center'), area(), body({ isStatic: true }) ],
                'a' : () => [ sprite('dirt-floor-right'), area(), body({ isStatic: true }) ],
                // // Brick wall
                'B' : () => [ sprite('brick-wall-top'), area(), body({ isStatic: true }) ],
                '4' : () => [ sprite('brick-wall-middle'), area(), body({ isStatic: true }) ],
                'b' : () => [ sprite('brick-wall-bottom'), area(), body({ isStatic: true }) ],
                // Brick floor
                'C' : () => [ sprite('brick-floor-left'), area(), body({ isStatic: true }) ],
                '5' : () => [ sprite('brick-floor-center'), area(), body({ isStatic: true }) ],
                'c' : () => [ sprite('brick-floor-right'), area(), body({ isStatic: true }) ],
                // Brick top
                ',' : () => [ sprite('brick-top-left'), area(), body({ isStatic: true }) ],
                '6' : () => [ sprite('brick-top-center'), area(), body({ isStatic: true }) ],
                '.' : () => [ sprite('brick-top-right'), area(), body({ isStatic: true }) ],
                // Brick middle
                ';' : () => [ sprite('brick-middle-left'), area(), body({ isStatic: true }) ],
                '7' : () => [ sprite('brick-middle-center'), area(), body({ isStatic: true }) ],
                ':' : () => [ sprite('brick-middle-right'), area(), body({ isStatic: true }) ],
                // Brick bottom
                '¤' : () => [ sprite('brick-bottom-left'), area(), body({ isStatic: true }) ],
                '8' : () => [ sprite('brick-bottom-center'), area(), body({ isStatic: true }) ],
                '#' : () => [ sprite('brick-bottom-right'), area(), body({ isStatic: true }) ],
                // Brick smooth
                'H' : () => [ sprite('brick-smooth-cracked'), area(), body({ isStatic: true }) ],
                'h' : () => [ sprite('brick-smooth'), area(), body({ isStatic: true }) ],
                // Ladder
                'D' : () => [ sprite('ladder-top'), area() ],
                '9' : () => [ sprite('ladder-middle'), area() ],
                'd' : () => [ sprite('ladder-bottom'), area() ],
                // Tall plant
                'E' : () => [ sprite('tall-plant-top'), area() ],
                '!' : () => [ sprite('tall-plant-middle'), area() ],
                'e' : () => [ sprite('tall-plant-bottom'), area() ],
                // Tree top
                'F' : () => [ sprite('tree-top'), area() ],
                '?' : () => [ sprite('tree-middle'), area() ],
                // Tree bottom
                'f' : () => [ sprite('tree-bottom'), area() ],
                'g' : () => [ sprite('tree-bottom-variant1'), area() ],
                'G' : () => [ sprite('tree-bottom-variant2'), area() ],
                // Coins
                'I' : () => [ sprite('coin-yellow'), area(), body(), 'coin' ],
                'i' : () => [ sprite('coin-red'), area(), body(), 'coin' ],
                'J' : () => [ sprite('coin-blue'), area(), body(), 'coin' ],
                'j' : () => [ sprite('coin-green'), area(), body(), 'coin' ],
                // Potions
                'M' : () => [ sprite('potion-green'), 'potion' ],
                'm' : () => [ sprite('potion-red'), 'potion' ],
                'N' : () => [ sprite('potion-brown'), 'potion' ],
                'n' : () => [ sprite('potion-yellow'), 'potion' ],
                // Clouds big corner
                'P' : () => [ sprite('cloud-big-top-left') ],
                'p' : () => [ sprite('cloud-big-top-right') ],
                'Q' : () => [ sprite('cloud-big-bottom-left') ],
                'q' : () => [ sprite('cloud-big-bottom-right') ],
                // Clouds small corner
                'R' : () => [ sprite('cloud-big-top-left') ],
                'r' : () => [ sprite('cloud-big-top-right') ],
                'S' : () => [ sprite('cloud-big-bottom-left') ],
                's' : () => [ sprite('cloud-big-bottom-right') ],
                // Clouds double corner
                'T' : () => [ sprite('cloud-doublecorner-top') ],
                't' : () => [ sprite('cloud-doublecorner-bottom') ],
                // Clouds solid color
                'U' : () => [ sprite('cloud-solid') ],
                'u' : () => [ sprite('sky-solid') ],
                // Plants
                'K' : () => [ sprite('flower-small') ],
                'k' : () => [ sprite('flower-big') ],
                // Stones
                'L' : () => [ sprite('rock-small') ],
                'l' : () => [ sprite('rock-big') ],
                
                'O' : () => [ sprite('wood-horizontal'), area(), body(), anchor("center") ],
                'o' : () => [ sprite('wood-vertical'), area(), body(), anchor("center") ], 

                'v' : () => [ sprite('single-dirt-block'), area(), body({ isStatic: true }) ],
                'w' : () => [ sprite('single-brick-block'), area(), body({ isStatic: true }) ],
                'x' : () => [ sprite('dirt-cave'), area(), body(), 'portal' ],
                'y' : () => [ sprite('water'), area(), body({ isStatic: true }), 'water' ], 

                // '@' : [ sprite('name'), solid(), scale(1), body(),'tag','tags' ]
            }
        }

        console.log("maps", maps);
        console.log("levelConfig", levelConfig);
        console.log("level", level);
        
        const gameLevel = addLevel(maps[level], levelConfig);

        // const scoreLabel = add([
        //     text('Gems ' + score),
        //     pos(100, 6),
        //     layer('ui'),
        //     {
        //         value: score
        //     }
        // ]);

        // add([
        //     text(' Level ' + parseInt(level + 1)),
        //     pos(10, 6)
        // ]);

        
        const levelElem = document.getElementById('level');
        levelElem.textContent = level + 1;
        
        // scorelabel = 0;
        // const gemsElem = document.getElementById('gems');
        // gemsElem.textContent = scoreLabel;

        // const dino = add([
        //     sprite("doux"),
        //     pos(25, height()/4),
        //     body(),
        //     area(),
            // area(vec2(-7, -1), vec2(7, -16)),
            // big(),
            // origin('bot'),
        // ]);

        
        const dino = gameLevel.spawn([
        // const dino = add([
            sprite("doux", { anim: "idle" }),
            body(),
            // pos(25, height()/4),
            // area({ shape: new Rect(vec2(0, 0), 16, 16) }),
            area(),
            anchor("center"),
            tile()
        ], 4, 0);

        // dino.play("idle");
        
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

        dino.onCollide('portal', () => {
            onKeyPress('s', () => {
                go('game', {
                    level: (level + 1) % maps.length,
                    score: scoreLabel
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
        dino.onCollide('coin', (coin) => {
            destroy(coin);
            scoreLabel++;
            // scoreLabel.text = 'Gems ' + scoreLabel.value;
            // scoreLabel.text = scoreLabel.value;
            const gemsElem = document.getElementById('gems');
            gemsElem.textContent = scoreLabel;
        });
        dino.onCollide('water', () => {
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

        dino.onUpdate(() => {
            if(dino.isGrounded()) {
                isJumping = false;
            }
        });
        dino.onUpdate(() => {
            camPos(dino.pos);
            if(dino.pos.y >= fallDeath){
                go('lose', {score: scoreLabel})
            }
        });

        // action('dangerous', (danger) => {
        //     danger.move(-enemySpeed, 0);
        // })
        // action('mushroom', (mushroom) => {
        //     mushroom.move(20, 0);
        // })


        onKeyDown('a', () => {
            dino.move(-moveSpeed, 0);
            dino.play("run");
        });
        onKeyDown('d', () => {
            dino.move(moveSpeed, 0);
            dino.play("run");
        });
        onKeyDown('s',() => {
            dino.play("sneak");
        });
        onKeyPress('space', () => {
            if(dino.isGrounded()) {
                isJumping = true;
                dino.jump(currentJumpForce);
                dino.play("jump");    
            }
        });
        onKeyRelease(['a', 'd', 's', 'space'], () => {
            dino.play("idle");
        });


        scene('lose', ({score}) => {
            function gemsText() {
                if(score == 1) {
                    return "gem";
                } else {
                    return "gems";
                }
            }
            add([ text(`Score ${score} ${gemsText()}`, 24), pos(width()/2, height()/2) ]);
            add([ text(`Press [ENTER] to play again \n or [ESC] to quit`, 10), pos(width()/2, height()/1.5) ]);
            updateHighscore(score);

            onKeyPress('enter', () => {
                console.log("ENTER!");
                restart();
            });
            onKeyPress('escape', () => {
                console.log("ESC!");
            });
        })

    })

    go("game", { level: 0, score: 0 });
}