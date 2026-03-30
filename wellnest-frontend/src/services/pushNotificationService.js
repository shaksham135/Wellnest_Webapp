import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

// Get API URL from env or use relative path (Capacitor handles baseUrl)
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Initializes Push Notifications for the mobile app.
 * - Requests permission
 * - Registers for FCM
 * - Syncs token with the backend
 */
export const registerPushNotifications = async () => {
  // Only execute on native platforms (Android/iOS)
  if (Capacitor.getPlatform() === 'web') {
    console.log('Push notifications: Skipping on web.');
    return;
  }

  try {
    // 1. Request/Check Permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission denied.');
      return;
    }

    // 2. Clear previous listeners (prevents duplicates during re-registers)
    await PushNotifications.removeAllListeners();

    // 3. Add Registration Success Listener
    await PushNotifications.addListener('registration', (token) => {
      console.log('Mobile Registration Success. Token:', token.value);
      syncTokenToBackend(token.value);
    });

    // 4. Add Registration Error Listener
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error.error);
    });

    // 5. Add Foreground Message Listener
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification);
      // Optional: Add custom toast or UI update for foreground alerts
    });

    // 6. Add Action Listener (User clicked notification)
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification.actionId, notification.notification);
    });

    // 7. Register
    await PushNotifications.register();
    console.log('Push notification registration initiated.');

  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

/**
 * Sends the FCM token to our industry-ready backend.
 */
const syncTokenToBackend = async (token) => {
  try {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.log('Sync postponed: User not logged in.');
      return;
    }

    await axios.post(`${API_URL}/api/notifications/fcm-token`, 
      { token },
      { 
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    console.log('FCM token verified and synced to Wellnest AI Coach.');
  } catch (err) {
    console.error('Failed to sync FCM token with backend:', err);
  }
};
