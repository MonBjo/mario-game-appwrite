const { Client, Account, Databases, ID, Query } = Appwrite;
const projectId = '6511e7ed14ed7455d2e1'; // TODO make secret
const databaseId = '';
const collectionId = '';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId)
;

const account = new Account(client);

function register(event) {
    event.preventDefault();
    console.log("event", event);
    console.log(event.target.elements);
    console.log("register-email", event.target.elements['register-email'].value);
    console.log("register-password", event.target.elements['register-password'].value);
    console.log("register-username", event.target.elements['register-username'].value);
    
    account.create(
        ID.unique(),
        event.target.elements['register-email'].value,
        event.target.elements['register-password'].value,
        event.target.elements['register-username'].value
    ), then(response => {
        console.log("Account create response",response);
        // TODO create a document in a database

        account.createEmailSession(
            event.target.elements['register-email'].value,
            event.target.elements['register-password'].value
        );
    }).catch(error => console.error("Account create error", error));

}