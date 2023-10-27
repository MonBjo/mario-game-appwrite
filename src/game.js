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
        if(isLogin) {
            const modalElem = document.getElementById('modal');
            modalElem.classList.add('hidden');
            const logoutButtonElem = document.getElementById('logout-button');
            logoutButtonElem.classList.remove('hidden');
            const gameInfoElems = document.querySelectorAll('.gameInfo');
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
    
    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;
    let isJumping = true;
    
    let scoreLabel = 0;

    // loadRoot("../assets/");
    // loadSprite("doux", "../assets/sprites/DinoSprites-doux.png", {
    //     sliceX: 24,
    //     sliceY: 0,
    //     anims: {
    //         idle: {
    //             from: 0,
    //             to: 2,
    //             speed: 12,
    //             loop: true
    //         },
    //         run: {
    //             from: 3,
    //             to: 9,
    //             speed: 24,
    //             loop: true
    //         },
    //         kick: {
    //             from: 10, 
    //             to: 12,
    //             speed: 6,
    //             loop: false
    //         },
    //         hurt: {
    //             from: 13,
    //             to: 16,
    //             speed: 16,
    //             loop: false
    //         },
    //         sneak: {
    //             from: 17,
    //             to: 23,
    //             speed: 14,
    //             loop: true
    //         },
    //         jump: {
    //             from: 21,
    //             to: 21
    //         }
    //     },
    // });
    // loadSprite("tiles", "../assets/sprites/nature-platformer-tileset-16x16.png", {
    //     sliceX: 7,
    //     sliceY: 11,
    // });

        // const levelConfig = {
        //     width: 15,
        //     height: 15,
        //     // Dirt top
        //     '(' : [ sprite('tiles'), solid(), {frame:0} ],
        //     '0' : [ sprite('tiles'), solid(), {frame:1} ],
        //     ')' : [ sprite('tiles'), solid(), {frame:2} ],
        //     // Dirt middle
        //     '[' : [ sprite('tiles'), solid(), {frame:7} ],
        //     '1' : [ sprite('tiles'), solid(), {frame:8} ],
        //     ']' : [ sprite('tiles'), solid(), {frame:9} ],
        //     // Dirt bottom
        //     '<' : [ sprite('tiles'), solid(), {frame:14} ],
        //     '2' : [ sprite('tiles'), solid(), {frame:15} ],
        //     '>' : [ sprite('tiles'), solid(), {frame:16} ],
        //     // Dirt floor
        //     'A' : [ sprite('tiles'), solid(), {frame:3} ],
        //     '3' : [ sprite('tiles'), solid(), {frame:4} ],
        //     'a' : [ sprite('tiles'), solid(), {frame:5} ],
        //     // Brick wall
        //     'B' : [ sprite('tiles'), solid(), {frame:6} ],
        //     '4' : [ sprite('tiles'), solid(), {frame:13} ],
        //     'b' : [ sprite('tiles'), solid(), {frame:20} ],
        //     // Brick floor
        //     'C' : [ sprite('tiles'), solid(), {frame:42} ],
        //     '5' : [ sprite('tiles'), solid(), {frame:43} ],
        //     'c' : [ sprite('tiles'), solid(), {frame:44} ],
        //     // Brick top
        //     ',' : [ sprite('tiles'), solid(), {frame:17} ],
        //     '6' : [ sprite('tiles'), solid(), {frame:18} ],
        //     '.' : [ sprite('tiles'), solid(), {frame:19} ],
        //     // Brick middle
        //     ';' : [ sprite('tiles'), solid(), {frame:24} ],
        //     '7' : [ sprite('tiles'), solid(), {frame:25} ],
        //     ':' : [ sprite('tiles'), solid(), {frame:26} ],
        //     // Brick bottom
        //     '¤' : [ sprite('tiles'), solid(), {frame:31} ],
        //     '8' : [ sprite('tiles'), solid(), {frame:32} ],
        //     '#' : [ sprite('tiles'), solid(), {frame:33} ],
        //     // Brick smooth
        //     'H' : [ sprite('tiles'), solid(), {frame:34} ],
        //     'h' : [ sprite('tiles'), solid(), {frame:41} ],
        //     // Ladder
        //     'D' : [ sprite('tiles'), solid(), {frame:21} ],
        //     '9' : [ sprite('tiles'), solid(), {frame:28} ],
        //     'd' : [ sprite('tiles'), solid(), {frame:35} ],
        //     // Tall plant
        //     'E' : [ sprite('tiles'), solid(), {frame:22} ],
        //     '!' : [ sprite('tiles'), solid(), {frame:29} ],
        //     'e' : [ sprite('tiles'), solid(), {frame:36} ],
        //     // Tree top
        //     'F' : [ sprite('tiles'), solid(), {frame:23} ],
        //     '?' : [ sprite('tiles'), solid(), {frame:30} ],
        //     // Tree bottom
        //     'f' : [ sprite('tiles'), solid(), {frame:37} ],
        //     'g' : [ sprite('tiles'), solid(), {frame:38} ],
        //     'G' : [ sprite('tiles'), solid(), {frame:39} ],
        //     // Coins
        //     'I' : [ sprite('tiles'), {frame:54}, 'coin' ],
        //     'i' : [ sprite('tiles'), {frame:55}, 'coin' ],
        //     'J' : [ sprite('tiles'), {frame:61}, 'coin' ],
        //     'j' : [ sprite('tiles'), {frame:62}, 'coin' ],
        //     // Potions
        //     'M' : [ sprite('tiles'), {frame:56} ],
        //     'm' : [ sprite('tiles'), {frame:57} ],
        //     'N' : [ sprite('tiles'), {frame:63} ],
        //     'n' : [ sprite('tiles'), {frame:64} ],
        //     // Clouds big corner
        //     'P' : [ sprite('tiles'),  {frame:51} ],
        //     'p' : [ sprite('tiles'),  {frame:52} ],
        //     'Q' : [ sprite('tiles'),  {frame:58} ],
        //     'q' : [ sprite('tiles'),  {frame:59} ],
        //     // Clouds small corner
        //     'R' : [ sprite('tiles'),  {frame:65} ],
        //     'r' : [ sprite('tiles'),  {frame:66} ],
        //     'S' : [ sprite('tiles'),  {frame:72} ],
        //     's' : [ sprite('tiles'),  {frame:73} ],
        //     // Clouds double corner
        //     'T' : [ sprite('tiles'),  {frame:53} ],
        //     't' : [ sprite('tiles'), {frame:67} ],
        //     // Clouds solid color
        //     'U' : [ sprite('tiles'), {frame:60} ],
        //     'u' : [ sprite('tiles'), {frame:74} ],
        //     // Plants
        //     'K' : [ sprite('tiles'), {frame:45} ],
        //     'k' : [ sprite('tiles'), {frame:48} ],
        //     // Stones
        //     'L' : [ sprite('tiles'),  {frame:46} ],
        //     'l' : [ sprite('tiles'),  {frame:47} ],
        //     // Trapdoor or wooden crate or closed window or whatever
        //     'O' : [ sprite('tiles'), solid(), {frame:49} ],
        //     'o' : [ sprite('tiles'), solid(), {frame:50} ], 

        //     'v' : [ sprite('tiles'), solid(), {frame:10} ], // Single dirt block
        //     'w' : [ sprite('tiles'), solid(), {frame:27} ], // single brick block
        //     'x' : [ sprite('tiles'),  {frame:11}, 'portal' ], // Dirt cave
        //     'y' : [ sprite('tiles'),  {frame:40}, 'water' ], // Water

        //     // '@' : [ sprite('name'), solid(), scale(1), body(),'tag','tags', {frame:0} ]
        // }
        
    var config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    var platforms;
    var player;
    var cursors;
    var level = 1;
    var levelText;

    var game = new Phaser.Game(config);
    
    function preload() {
        this.load.image('sky', '../assets/temporary/sky.png');
        this.load.image('ground', '../assets/temporary/platform.png');
        this.load.image('star', '../assets/temporary/star.png');
        this.load.image('bomb', '../assets/temporary/bomb.png');
        this.load.spritesheet('dude', 
            '../assets/temporary/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );
    }
    
    function create() {
        // world
        this.add.image(0, 0, 'sky').setOrigin(0, 0);

        platforms = this.physics.add.staticGroup();

        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');


        // player
        player = this.physics.add.sprite(100, 450, 'dude');
        
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1 // loop
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        cursors = this.input.keyboard.createCursorKeys();
        console.log("cursors ", cursors);

        this.physics.add.collider(player, platforms);


        // interactive
        stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });
        
        stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.physics.add.collider(stars, platforms);
        this.physics.add.overlap(player, stars, collectStar, null, this);

        // ui
        levelText = this.add.text(16, 16, 'level: 1', { fontSize: '32px', fill: '#000' });

        // bombs
        bombs = this.physics.add.group();
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(player, bombs, hitBomb, null, this);

    }

    function update() {
        if(cursors.left.isDown) {
            player.setVelocityX(-160);
            player.anims.play('left', true);
        }
        else if(cursors.right.isDown) {
            player.setVelocityX(160);
            player.anims.play('right', true);
        }
        else {
            player.setVelocityX(0);
            player.anims.play('turn');
        }

        if(cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-330);
        }
    }


    function collectStar(player, star) {
        const gemsElem = document.getElementById('gems');
        gemsElem.textContent = score;

        star.disableBody(true, true);

        if(stars.countActive(true) === 0) {
            stars.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true);
            });

            var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

            var bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    function hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
    }
}