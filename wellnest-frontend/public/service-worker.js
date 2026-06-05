/* eslint-disable no-restricted-globals */

// Wellnest PWA Service Worker
const CACHE_NAME = "wellnest-cache-v1";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/favicon.ico",
    "/logo_wellnest.png",
    "/manifest.json"
];

// Install Event: Pre-cache essential assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[Service Worker] Pre-caching core PWA shell assets");
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up legacy caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log("[Service Worker] Removing old cache:", key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-first falling back to cache (safeguard React dev mode hot reloading)
self.addEventListener("fetch", (event) => {
    // Only intercept local GET requests
    if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache valid response clone
                if (response && response.status === 200 && response.type === "basic") {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, attempt cache lookup
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // SPA Routing fallback
                    if (event.request.headers.get("accept")?.includes("text/html")) {
                        return caches.match("/index.html");
                    }
                });
            })
    );
});

// Push Notification Listener (Preserve existing functionality)
self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { message: event.data ? event.data.text() : "" };
    }
    
    const title = data.title || "Wellnest Notification";
    const options = {
        body: data.message || "You have a new update!",
        icon: "/logo_wellnest.png",
        badge: "/logo_wellnest.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Listener (Preserve existing functionality)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        // eslint-disable-next-line no-undef
        clients.openWindow(event.notification.data.url)
    );
});
