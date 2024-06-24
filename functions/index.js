const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendNotification = functions.https.onCall(async (data) => {
  const { title, body, isla, manzana, rol } = data;

  if (!title || !body || (!isla && !manzana && !rol)) {
    throw new functions.https.HttpsError('invalid-argument', 'El título, el cuerpo y al menos uno de los filtros (isla, manzana, rol) son obligatorios.');
  }

  try {
    const tokens = await getUserTokens(isla, manzana, rol);
    
    if (tokens.length === 0) {
      return { success: false, message: 'No se encontraron tokens para los filtros proporcionados.' };
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
    return { success: true, response };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
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
    queryRef = queryRef.where('rol', 'in', rol);
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
