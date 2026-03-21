/* eslint-disable no-restricted-globals */

// This service worker handles background notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Wellnest Notification';
    const options = {
        body: data.message || 'You have a new update!',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        // eslint-disable-next-line no-undef
        clients.openWindow(event.notification.data.url)
    );
});
