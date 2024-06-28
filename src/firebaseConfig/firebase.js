// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8lSjoGXYBRo8HDm8fQtmJWT9FQrEVtHg",

  authDomain: "cube-b5537.firebaseapp.com",

  databaseURL: "https://cube-b5537-default-rtdb.firebaseio.com",

  projectId: "cube-b5537",

  storageBucket: "cube-b5537.appspot.com",

  messagingSenderId: "746288096117",

  appId: "1:746288096117:web:4a121eea0fc0e72fb5e93c",

  measurementId: "G-3HVP2KTDDX"


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
export const analytics = getAnalytics(app);
// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

export const obtenerTokenFCM = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw' });
    if (currentToken) {
      console.log('Token de FCM:', currentToken);
      return currentToken;
    } else {
      console.log('No se pudo obtener el token. Solicita permiso para recibir notificaciones primero.');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el token de FCM:', error);
    return null;
  }
};
