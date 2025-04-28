// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object

// Log service worker initialization
console.log('[firebase-messaging-sw.js] Initializing Firebase app in service worker');

// Get Firebase configuration from the URL query parameters if available
let firebaseConfig = {
  apiKey: "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
  authDomain: "mypts-6a894.firebaseapp.com",
  projectId: "mypts-6a894",
  storageBucket: "mypts-6a894.appspot.com",
  messagingSenderId: "1080632618681",
  appId: "1:1080632618681:web:0e155eaa624e80b4a1f568",
  measurementId: "G-VWPJWY520R"
};

// Try to get configuration from the service worker registration
try {
  // Log the service worker scope and URL
  console.log('[firebase-messaging-sw.js] Service worker scope:', self.registration.scope);
  console.log('[firebase-messaging-sw.js] Service worker URL:', self.location.href);

  // Try to parse configuration from URL if available
  const urlParams = new URL(self.location.href).searchParams;
  const configParam = urlParams.get('firebaseConfig');

  if (configParam) {
    try {
      const parsedConfig = JSON.parse(decodeURIComponent(configParam));
      console.log('[firebase-messaging-sw.js] Using Firebase config from URL parameters');
      firebaseConfig = parsedConfig;
    } catch (parseError) {
      console.error('[firebase-messaging-sw.js] Error parsing Firebase config from URL:', parseError);
    }
  }
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error getting configuration:', error);
}

// Log the Firebase configuration being used (without sensitive values)
console.log('[firebase-messaging-sw.js] Using Firebase config:', {
  projectId: firebaseConfig.projectId,
  messagingSenderId: firebaseConfig.messagingSenderId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase with the configuration
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  try {
    // Extract notification data from the payload
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationBody = payload.notification?.body || 'You have a new notification';

    // Get the icon URL - use absolute URL for production
    const iconUrl = self.location.origin + '/logo192.png';
    const badgeUrl = self.location.origin + '/badge.png';

    // Prepare notification options
    const notificationOptions = {
      body: notificationBody,
      icon: iconUrl,
      badge: badgeUrl,
      data: payload.data || {},
      // Add vibration pattern
      vibrate: [100, 50, 100],
      // Add notification timestamp
      timestamp: Date.now()
    };

    // Add actions if available in the payload
    if (payload.data?.actions) {
      try {
        const actions = JSON.parse(payload.data.actions);
        if (Array.isArray(actions)) {
          notificationOptions.actions = actions;
        }
      } catch (actionsError) {
        console.error('[firebase-messaging-sw.js] Error parsing notification actions:', actionsError);
      }
    }

    // Add click action if available
    if (payload.data?.clickAction) {
      notificationOptions.data.clickAction = payload.data.clickAction;
    }

    // Add URL if available
    if (payload.data?.url) {
      notificationOptions.data.url = payload.data.url;
    }

    console.log('[firebase-messaging-sw.js] Showing notification:', {
      title: notificationTitle,
      options: {
        ...notificationOptions,
        // Don't log the full data object to avoid cluttering the logs
        data: '...'
      }
    });

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error showing notification:', error);

    // Fallback to a simple notification if there's an error
    return self.registration.showNotification(
      'New Notification',
      {
        body: 'You have a new notification',
        icon: '/logo192.png'
      }
    );
  }
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

// Handle install event - this runs when the service worker is first installed
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  // Skip the waiting phase and activate immediately
  event.waitUntil(self.skipWaiting());
});

// Handle activate event - this runs when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  // Claim all clients to ensure the service worker controls all pages immediately
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[firebase-messaging-sw.js] Clients claimed successfully');

      // Notify all clients that the service worker is active
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service worker is now active and controlling the page'
          });
        });
      }).catch(error => {
        console.error('[firebase-messaging-sw.js] Error notifying clients:', error);
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[firebase-messaging-sw.js] Skipping waiting phase');
    self.skipWaiting().then(() => {
      console.log('[firebase-messaging-sw.js] Successfully skipped waiting phase');
    }).catch(error => {
      console.error('[firebase-messaging-sw.js] Error skipping waiting phase:', error);
    });
  }

  if (event.data && event.data.type === 'CLAIM_CLIENTS') {
    console.log('[firebase-messaging-sw.js] Claiming clients');
    clients.claim().then(() => {
      console.log('[firebase-messaging-sw.js] Successfully claimed clients');

      // Notify the client that sent the message
      if (event.source) {
        try {
          event.source.postMessage({
            type: 'CLIENTS_CLAIMED',
            message: 'Service worker has claimed all clients'
          });
        } catch (error) {
          console.error('[firebase-messaging-sw.js] Error sending message to client:', error);
        }
      }
    }).catch(error => {
      console.error('[firebase-messaging-sw.js] Error claiming clients:', error);
    });
  }
});

// Log any errors that occur in the service worker
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Error in service worker:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});

// Service worker is now properly configured
