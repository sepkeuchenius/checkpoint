import {initializeApp} from "firebase/app"
import {getAuth, GoogleAuthProvider, signInWithCredential} from "firebase/auth"
function retrieveApp(){
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCSQ0Sd9I2wCF5HQ8nJ3DPcbQTlCR7zPYY",
        databaseURL: "https://checkpoint-cfee1-default-rtdb.firebaseio.com/",
    };
    const app = initializeApp(config);
    return app
}

export function login(){
    retrieveApp()
    const auth = getAuth()
    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
      var credential = GoogleAuthProvider.credential(null, token);
      console.log(credential)
      signInWithCredential(auth, credential);
    });
}
