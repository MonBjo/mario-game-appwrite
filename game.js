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
    // TODO check incoming values from elements
    account.create(
        ID.unique(),
        event.target.elemtents['register-email'].value,
        event.target.elemtents['register-password'].value,
        event.target.elemtents['register-username'].value
    ), then(response => {
        console.log("Account create response",response);
        // TODO create a document in a database

        account.createEmailSession(
            event.target.elemtents['register-email'].value,
            event.target.elemtents['register-password'].value
        );
    }).catch(error => console.error("Account create error", error));

}