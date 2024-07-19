import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth"
export const app = retrieveApp()
function retrieveApp() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCSQ0Sd9I2wCF5HQ8nJ3DPcbQTlCR7zPYY",
        databaseURL: "wss://checkpoint-cfee1-default-rtdb.firebaseio.com/",
    };
    const app = initializeApp(config);
    return app
}

export async function login() {
    retrieveApp()
    const auth = getAuth()
    if(!auth.currentUser){
        return await chrome.identity.getAuthToken({ 'interactive': true }).then(async (token) => {
            console.log(token)
            var credential = GoogleAuthProvider.credential(null, token.token);
            const auth = getAuth()
            console.log(credential)
            return await signInWithCredential(auth, credential).then((userCred) => {
                return getAuth().currentUser
            });
        });
    }
    else {
        console.log("already logged in")
    }
}

export function getUserInfo(){
    return getAuth(app);
}
