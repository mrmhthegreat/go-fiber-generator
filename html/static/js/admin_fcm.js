// Firebase Cloud Messaging Configuration for Web Super Admin

const firebaseConfig = {
    apiKey: "AIzaSyB6H7y4jgXCLrtnu2y7iuhl8FNVta9vkNw",
    authDomain: "lemly-io.firebaseapp.com",
    projectId: "lemly-io",
    storageBucket: "lemly-io.firebasestorage.app",
    messagingSenderId: "31155752491",
    appId: "1:31155752491:web:a4d16ef1963334ee13e46e",
    measurementId: "G-V1QKDQTY73"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Create notification UI container
function createNotificationUI() {
    if (document.getElementById('fcm-notification-container')) return;
    
    const container = document.createElement('div');
    container.id = 'fcm-notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        max-width: 400px;
        pointer-events: none;
    `;
    document.body.appendChild(container);
}

// Show custom notification in UI
function showNotificationUI(title, body, icon = '/static/image/desktop-logo.png', data = {}) {
    createNotificationUI();
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        gap: 12px;
        align-items: start;
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: slideIn 0.3s ease;
        border-left: 4px solid #4285f4;
    `;
    
    notification.innerHTML = `
        <img src="${icon}" 
             style="width: 48px; height: 48px; border-radius: 8px; object-fit: contain;" 
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><text y=%2220%22 font-size=%2220%22>🔔</text></svg>'"
             alt="notification icon">
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px; color: #202124; margin-bottom: 4px;">
                ${title}
            </div>
            <div style="font-size: 13px; color: #5f6368; line-height: 1.4;">
                ${body}
            </div>
        </div>
        <button onclick="this.parentElement.remove()" 
                style="background: none; border: none; color: #5f6368; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; line-height: 1;">
            ×
        </button>
    `;
    
    // Add hover effect
    notification.onmouseenter = () => {
        notification.style.transform = 'translateX(-5px)';
        notification.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
    };
    notification.onmouseleave = () => {
        notification.style.transform = 'translateX(0)';
        notification.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    };
    
    // Click to handle notification action
    notification.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') {
            console.log('Notification clicked:', data);
            // Add your click handler here
            if (data.url) {
                window.location.href = data.url;
            }
        }
    };
    
    const container = document.getElementById('fcm-notification-container');
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

async function initFCM() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('/static/firebase-messaging-sw.js');

            let serviceWorker = registration.installing || registration.waiting || registration.active;

            if (serviceWorker) {
                if (serviceWorker.state !== "activated") {
                    await new Promise(resolve => {
                        const stateListener = () => {
                            if (serviceWorker.state === "activated") {
                                serviceWorker.removeEventListener("statechange", stateListener);
                                resolve();
                            }
                        };
                        serviceWorker.addEventListener("statechange", stateListener);
                        if (serviceWorker.state === "activated") resolve();
                    });
                }
            }

            const token = await messaging.getToken({
                vapidKey: 'BABhp6mVXt319FPOFbQ-ew3pEZSOMnNSXtHy9PaEvdoNaz2BpjAKVZY81cr2-rj589dzJdsOyBe6O3l7yRfNyCA',
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log("FCM Token:", token);

                const sentToken = localStorage.getItem('fcm_token_sent_to_server');
                if (sentToken !== token) {
                    subscribeTokenToTopic(token);
                } 
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        } else {
            console.log("Unable to get permission to notify.");
        }
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
    }
}

// Receive messages when app is in foreground - UPDATED WITH CUSTOM UI
messaging.onMessage((payload) => {
    console.log('Foreground message received:', payload);
    
    const title = payload.notification?.title || 'New Notification';
    const body = payload.notification?.body || '';
    const icon = payload.notification?.icon || '/static/image/desktop-logo.png';
    const data = payload.data || {};
    
    // Show custom UI notification
    showNotificationUI(title, body, icon, data);
    
    // Also play notification sound (optional)
   
    // Optionally still show browser notification if page is not focused
    if (document.hidden) {
        new Notification(title, {
            body: body,
            icon: icon,
            badge: '/static/favicon-96x96.png',
            tag: 'fcm-notification',
            requireInteraction: false
        });
    }
});

function subscribeTokenToTopic(token) {
    fetch(window.DASH_BASE + '/notifications/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ token: token })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error subscribing to topic:", data.error);
            } else {
                localStorage.setItem('fcm_token_sent_to_server', token);
            }
        })
        .catch(error => {
            console.error("Network error subscribing to topic:", error);
        });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
    initFCM();
});