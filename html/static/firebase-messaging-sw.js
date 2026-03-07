// firebase-messaging-sw.js
// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyB6H7y4jgXCLrtnu2y7iuhl8FNVta9vkNw",
    authDomain: "lemly-io.firebaseapp.com",
    projectId: "lemly-io",
    storageBucket: "lemly-io.firebasestorage.app",
    messagingSenderId: "31155752491",
    appId: "1:31155752491:web:a4d16ef1963334ee13e46e",
    measurementId: "G-V1QKDQTY73"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: '/static/image/desktop-logo.png', // Your logo path
        badge: '/static/favicon-96x96.png', // Small badge icon (72x72 or 96x96 recommended)
        image: payload.notification?.image || null, // Large image (optional)
        data: payload.data || {},
        tag: payload.data?.tag || 'default-notification', // Groups similar notifications
        requireInteraction: false, // Set to true if you want notification to stay until clicked
        vibrate: [200, 100, 200], // Vibration pattern
        actions: [
            {
                action: 'view',
                title: 'View',
            },
            {
                action: 'close',
                title: 'Close',
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    
    event.notification.close();
    
    // Handle different actions
    if (event.action === 'view') {
        // Open the app or specific URL
        const urlToOpen = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if there's already a window open
                    for (let client of clientList) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window if none found
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    } else if (event.action === 'close') {
        // Just close the notification (already done above)
        console.log('Notification closed by user');
    } else {
        // Default click (no action button)
        const urlToOpen = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (let client of clientList) {
                        if ('focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification was closed:', event);
    // You can track notification dismissals here
});