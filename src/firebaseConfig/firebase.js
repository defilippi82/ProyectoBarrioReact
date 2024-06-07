// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

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

  /*apiKey: process.env.API_KEY,

  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID*/
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Añadir mensaje

export const addMessage = async (message) => {
  try {
    await addDoc(collection(db, "messages"), message);
  } catch (error) {
    console.error("Error adding message: ", error);
  }
};

export const subscribeToMessages = (callback) => {
  return onSnapshot(collection(db, "messages"), (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};


