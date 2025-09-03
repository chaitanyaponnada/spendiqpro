
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "spendwise-x6jw7",
  "appId": "1:4873645593:web:c35fdbd2aaaec38539c488",
  "storageBucket": "spendwise-x6jw7.appspot.com",
  "apiKey": "AIzaSyBThjLyAiZVX-FkH9L0wMrrFBIEbbvxI7E",
  "authDomain": "spendwise-x6jw7.firebaseapp.com",
  "messagingSenderId": "4873645593",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
