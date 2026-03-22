// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// IMPORTANT: Manual values are required here as this file is static
// Copy these from your Firebase Console (Public identifiers only)
firebase.initializeApp({
  apiKey: "AIzaSyACgkI6B9FnCfeBR3Men9MpKPxFpT76c8I",
  projectId: "wellnest-490516",
  messagingSenderId: "824393698796",
  appId: "1:824393698796:web:d0ef312f217816e64244c9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
