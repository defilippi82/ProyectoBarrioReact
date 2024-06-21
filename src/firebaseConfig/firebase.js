// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8lSjoGXYBRo8HDm8fQtmJWT9FQrEVtHg",

  authDomain: "cube-b5537.firebaseapp.com",

  projectId: "cube-b5537",

  storageBucket: "cube-b5537.appspot.com",

  messagingSenderId: "746288096117",

  appId: "1:746288096117:web:4a121eea0fc0e72fb5e93c"

  /*apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID*/
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);


