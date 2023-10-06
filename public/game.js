//import { projectId, databaseId, collectionId } from "../secrets";
// import keys from '../secrets.json' assert { type: 'json' };

// fetch("../secrets.json")
//     .then(response => response.json())
//     .then(data => { 
//         console.log("data: ", data);
//     }
// );

const { Client, Account, Databases, ID, Query } = Appwrite;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId)
;

const account = new Account(client);
const database = new Databases(client);

function register(event) {
    event.preventDefault();
    // console.log("event", event);
    // console.log(event.target.elements);
    // console.log("register-email", event.target.elements['register-email'].value);
    // console.log("register-password", event.target.elements['register-password'].value);
    // console.log("register-username", event.target.elements['register-username'].value);
    
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
        })

    }).catch(error => console.error("Account create error", error));
}

function login(event) {

}

function showDisplay() {
    const modalElem = document.getElementById('modal');
    modalElem.classList.add('hidden');
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
    const enemyDeath = 20;

    let isJumping = true;
    
    // imgur.com/a/F8Jkryq
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
    loadSprite('blue-block',        'FVscIbn.png');
    loadSprite('blue-brick',        '3e5YRQd.png');
    loadSprite('blue-steel',        'gqVoI2b.png');
    loadSprite('blue-evil-mushroom','SvV4ueD.png');
    loadSprite('blue-surprise',     'RMqCc1G.png');
    // loadSprite('','.png');

    scene("game", ({ level, score }) => {
        layers(["bg", "obj", "ui"], "obj");

        const maps = [
            [
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '==============================   =====',
            ],
            [
                // map number two
            ]
        ]

        const levelConfig = {
            width: 20,
            height: 20,
            '=' : [sprite('block'), solid()]
        }

        const gameLevel = addLevel(maps[level], levelConfig);

    })

    start("game", { level: 0, score: 0 });
}

startGame();