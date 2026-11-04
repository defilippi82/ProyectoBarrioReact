import { getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { messaging, db } from "../firebaseConfig/firebase"; // Ajusta tu ruta a firebase.js

export const solicitarPermisoNotificaciones = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Reemplaza con tu VAPID key de la consola de Firebase Cloud Messaging
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw' 
      });

      if (currentToken && userId) {
        // Guardamos el token en el documento del usuario en Firestore
        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken) // Usamos arrayUnion por si entra desde varios dispositivos
        });
        console.log("Token FCM registrado con éxito:", currentToken);
      }
    } else {
      console.log("Permiso de notificaciones denegado.");
    }
  } catch (error) {
    console.error("Error al obtener el token de notificaciones:", error);
  }
};