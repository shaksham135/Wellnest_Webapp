import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration using environment variables from Render
// Note: These must start with REACT_APP_ to be picked up by the React build
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export const requestForToken = async () => {
  return getToken(messaging, { 
    vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY 
  })
    .then((currentToken) => {
      if (currentToken) {
        console.log('FCM Web Token received: ', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    })
    .catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
      return null;
    });
};

export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground Message received: ", payload);
    callback(payload);
  });
};

export { messaging };
