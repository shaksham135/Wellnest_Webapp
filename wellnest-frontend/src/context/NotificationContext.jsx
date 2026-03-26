import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getNotifications } from '../api/notificationApi';
import { updateFcmToken } from '../api/userApi';
import { toast } from 'react-hot-toast';
import { requestForToken, onMessageListener } from '../firebase';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [permissionStatus, setPermissionStatus] = useState(
        "Notification" in window ? Notification.permission : "default"
    );
    const lastNotifiedId = useRef(null);

    const showSystemNotification = useCallback((n) => {
        if (!("Notification" in window)) return;
        
        if (permissionStatus === "granted") {
            new Notification(n.title, {
                body: n.message,
                icon: '/logo192.png'
            });
        }
    }, [permissionStatus]);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);

            // Check for new notifications to show system alert
            if (data.length > 0) {
                const newest = data[0];
                if (!newest.read && newest.id !== lastNotifiedId.current) {
                    showSystemNotification(newest);
                    lastNotifiedId.current = newest.id;
                }
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, [showSystemNotification]);

    const requestPermission = useCallback(async () => {
        // Handle Native Mobile Push Permissions
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const result = await PushNotifications.requestPermissions();
                if (result.receive === 'granted') {
                    PushNotifications.register();
                    setPermissionStatus("granted");
                    toast.success("Native push notifications ready!");
                } else {
                    setPermissionStatus("denied");
                }
            } catch (err) {
                console.error("Native push error:", err);
            }
            return;
        }

        // Standard Web Notification Logic
        if (!("Notification" in window)) {
            toast.error("Notifications not supported in this browser");
            return;
        }

        if (Notification.permission === "granted") {
            toast.success("Notifications already enabled!");
            setPermissionStatus("granted");
            return;
        }

        if (Notification.permission === "denied") {
            toast.error("Notification permission denied. Please check your browser settings.");
            setPermissionStatus("denied");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission === "granted") {
                toast.success("Notifications enabled!");
                
                // Get FCM Token for Web Push
                const token = await requestForToken();
                if (token) {
                    await updateFcmToken(token);
                    console.log("Web FCM Token registered with backend");
                }

                const data = await getNotifications();
                if (data.length > 0 && !data[0].read) {
                    showSystemNotification(data[0]);
                } else {
                    new Notification("Wellnest", { body: "You will now receive health alerts here." });
                }
            } else if (permission === "denied") {
                toast.error("Notification permission denied");
            }
        } catch (err) {
            console.error("Error requesting permission:", err);
        }
    }, [showSystemNotification]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Standard 30s poll
        
        // --- Auto-request Permission ---
        // If status is still 'default' (not yet asked), ask automatically after a short delay
        const autoRequestTimeout = setTimeout(() => {
            if (permissionStatus === "default") {
                console.log("Automatically requesting notification permissions...");
                requestPermission();
            }
        }, 3000); // 3-second delay after mount/load

        // --- Native Mobile Sync ---
        const setupNativePush = async () => {
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                try {
                    const { PushNotifications } = await import('@capacitor/push-notifications');
                    
                    // On success, register the token with our backend
                    PushNotifications.addListener('registration', (token) => {
                        console.log('Push registration success, token: ' + token.value);
                        updateFcmToken(token.value);
                    });

                    PushNotifications.addListener('registrationError', (error) => {
                        console.error('Error on registration: ' + JSON.stringify(error));
                    });

                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        console.log('Push received: ' + JSON.stringify(notification));
                        fetchNotifications();
                    });
                } catch (e) {
                    console.log("Capacitor Push plugins not found—running in web fallback.");
                }
            }
        };
        setupNativePush();

        // --- Web Foreground Messaging ---
        const unsubscribe = onMessageListener(payload => {
            console.log("New foreground message:", payload);
            toast(payload.notification.body, {
                icon: '🔔',
                duration: 4000
            });
            fetchNotifications();
        });

        return () => {
            clearInterval(interval);
            clearTimeout(autoRequestTimeout);
            unsubscribe();
        };
    }, [fetchNotifications, permissionStatus, requestPermission]);

    const sendTestNotification = () => {
        showSystemNotification({
            title: "Wellnest Test Alert",
            message: "Success! Your device is now ready for health reminders. 🚀"
        });
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            permissionStatus,
            requestPermission,
            sendTestNotification,
            refreshNotifications: fetchNotifications 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
