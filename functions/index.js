const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.sendNotification = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { title, body, isla, manzana, rol } = req.body;

    if (!title || !body || (!isla && !manzana && !rol)) {
      res.status(400).send('El título, el cuerpo y al menos uno de los filtros (isla, manzana, rol) son obligatorios.');
      return;
    }

    try {
      const tokens = await getUserTokens(isla, manzana, rol);

      if (tokens.length === 0) {
        res.status(404).send('No se encontraron tokens para los filtros proporcionados.');
        return;
      }

      const message = {
        notification: {
          title: title,
          body: body
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log('Successfully sent message:', response);
      res.status(200).json({ success: true, response });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

const getUserTokens = async (isla, manzana, rol) => {
  const db = admin.firestore();
  const tokens = [];
  let queryRef = db.collection('usuarios');

  if (isla && isla.length > 0) {
    queryRef = queryRef.where('isla', 'in', isla);
  }

  if (manzana && manzana.length > 0) {
    queryRef = queryRef.where('manzana', 'in', manzana);
  }

  if (rol && rol.length > 0) {
    queryRef = queryRef.where('rol.guardia', '==', true); // Asegúrate de ajustar la consulta al nuevo formato de rol
  }

  const snapshot = await queryRef.get();

  snapshot.forEach(doc => {
    const userData = doc.data();
    if (userData.fcmToken) {
      tokens.push(userData.fcmToken);
    }
  });

  return tokens;
};
