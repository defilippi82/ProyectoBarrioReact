const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// 1. Notificación cuando un vecino envía un mensaje directo por Mensajería
exports.enviarNotificacionMensaje = onDocumentCreated("mensajeria/{mensajeId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const mensaje = snapshot.data();

  try {
    // Buscamos al usuario receptor en la colección 'usuarios' usando su formato Manzana-Lote o ID
    // (Asumiendo que guardas el token en su documento de usuario)
    const usuariosRef = admin.firestore().collection("usuarios");
    const querySnapshot = await usuariosRef.where("barrioId", "==", mensaje.barrioId).get();

    let fcmToken = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // O puedes mapear el receptor exacto si guardas la relación con su UID
      const socioActual = `${data.manzana}-${data.lote}`;
      if (socioActual === mensaje.receiver && data.fcmToken) {
        fcmToken = data.fcmToken;
      }
    });

    if (!fcmToken) {
      console.log("El destinatario no tiene un token FCM registrado.");
      return;
    }

    const payload = {
      token: fcmToken,
      notification: {
        title: `Nuevo mensaje de ${mensaje.senderName || 'un vecino'}`,
        body: mensaje.content.substring(0, 100),
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        remitente: mensaje.sender,
      },
    };

    await admin.messaging().send(payload);
    console.log("Notificación de mensaje enviada con éxito.");
  } catch (error) {
    console.error("Error al enviar notificación push:", error);
  }
});

// 2. Notificación cuando la administración crea una Campaña masiva
exports.enviarNotificacionCampana = onDocumentCreated("campanas/{campanaId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const campana = snapshot.data();

  try {
    const usuariosRef = admin.firestore().collection("usuarios");
    const querySnapshot = await usuariosRef.where("barrioId", "==", campana.barrioId).get();

    const tokens = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log("No hay tokens registrados para esta campaña.");
      return;
    }

    const message = {
      notification: {
        title: campana.title,
        body: campana.body,
      },
      tokens: tokens, // Firebase permite enviar hasta 500 tokens en lote
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Campañas enviadas con éxito: ${response.successCount} notificaciones.`);
  } catch (error) {
    console.error("Error al enviar campañas masivas:", error);
  }
});