import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Quitamos lo que no usas aquí
import { getMessaging, getToken } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

// COMENTA ESTO TEMPORALMENTE
/*
enableIndexedDbPersistence(db).catch((err) => {
  console.log("Error persistencia: ", err.code);
});
*/

export const obtenerTokenFCM = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw' 
    });
    return currentToken;
  } catch (error) {
    return null;
  }
};
