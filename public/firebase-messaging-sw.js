importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inicializa Firebase en el Service Worker con tus credenciales públicas
firebase.initializeApp({
  apiKey: "tAIzaSyD8lSjoGXYBRo8HDm8fQtmJWT9FQrEVtHg",
  authDomain: "cube-b5537.firebaseapp.com",
  databaseURL: "https://cube-b5537-default-rtdb.firebaseio.com",
  projectId: "cube-b5537",
  storageBucket: "cube-b5537.appspot.com",
  messagingSenderId: "1075489234567",
  appId: "1:1075489234567:web:abcdef1234567890"
});

const messaging = firebase.messaging();

// Manejo opcional de notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});