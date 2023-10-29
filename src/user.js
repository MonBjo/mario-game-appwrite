
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

