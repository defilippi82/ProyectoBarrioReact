import { getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, getFirestore, setDoc } from "firebase/firestore";
import { messaging, db, auth } from "../../firebaseConfig/firebase"; // Ajusta tu ruta a firebase.js
import Swal from 'sweetalert2';

export const registrarNotificaciones = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // 1. Registramos explícitamente el service worker desde la carpeta public
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // 2. Pasamos el serviceWorkerRegistration a getToken
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw',
        serviceWorkerRegistration: registration 
      });

      if (currentToken && auth.currentUser) {
        const db = getFirestore();
        const usuarioRef = doc(db, 'usuarios', auth.currentUser.uid);
        await setDoc(usuarioRef, { fcmToken: currentToken }, { merge: true });
        console.log("Token FCM guardado con éxito.");
      }
    }
  } catch (error) {
    console.error('Error al registrar las notificaciones push:', error);
  }
};