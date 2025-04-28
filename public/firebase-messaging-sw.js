// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  // Using actual Firebase config values
  apiKey: "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
  authDomain: "mypts-6a894.firebaseapp.com",
  projectId: "mymypts-6a894",
  storageBucket: "mypts-6a894.firebasestorage.app",
  messagingSenderId: "1080632618681",
  appId: "1:1080632618681:web:0e155eaa624e80b4a1f568",
  measurementId: "G-VWPJWY520R"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click: ', event);

  event.notification.close();

  // Handle click action
  const clickAction = event.notification.data?.clickAction;
  const url = event.notification.data?.url;

  if (clickAction === 'OPEN_URL' && url) {
    // Open the URL
    event.waitUntil(clients.openWindow(url));
  } else {
    // Default action: open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If a window is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }

          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
