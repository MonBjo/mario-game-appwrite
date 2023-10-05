import { projectId, databaseId, collectionId } from "../secrets";

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
    ), then(response => {
        console.log("Account create response",response);
        database.createDocument(databaseId, collectionId);

        account.createEmailSession(
            event.target.elements['register-email'].value,
            event.target.elements['register-password'].value
        );
    }).catch(error => console.error("Account create error", error));

}