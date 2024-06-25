import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import functions from 'firebase-functions';

initializeApp();

const db = getFirestore();

export const sendNotification = functions.https.onCall(async (data) => {
  const { title, body, userIds } = data;

  if (!userIds || userIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'User IDs must be provided');
  }

  const tokens = [];

  for (const userId of userIds) {
    const userDoc = await db.collection('usuarios').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    }
  }

  if (tokens.length === 0) {
    throw new functions.https.HttpsError('not-found', 'No FCM tokens found for the provided user IDs');
  }

  const message = {
    notification: {
      title,
      body
    },
    tokens
  };

  try {
    const response = await getMessaging().sendMulticast(message);
    return { success: true, response };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error sending notification', error);
  }
});
