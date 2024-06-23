//import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

export const enviarNotificacion = onDocumentCreated("notificaciones/{notificacionId}", async (event) => {
    const nuevaNotificacion = event.data.data();
    const { token, mensaje, prioridad } = nuevaNotificacion;

    const mensaje_notificacion = {
        token: token,
        notification: {
            title: 'Alerta de seguridad',
            body: mensaje
        },
        data: {
            prioridad: prioridad
        }
    };

    try {
        const respuesta = await getMessaging().send(mensaje_notificacion);
        console.log('Notificación enviada con éxito:', respuesta);
        return null;
    } catch (error) {
        console.error('Error al enviar la notificación:', error);
        return null;
    }
});