// Simple FCM service worker
self.addEventListener('install', (event) => {
  console.log('[fcm-messaging-sw.js] Service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[fcm-messaging-sw.js] Service worker activated');
  // Claim all clients to ensure the service worker is controlling the page
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[fcm-messaging-sw.js] Push notification received', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[fcm-messaging-sw.js] Push data:', data);
      
      const notificationTitle = data.notification?.title || 'New Notification';
      const notificationOptions = {
        body: data.notification?.body || 'You have a new notification',
        icon: '/logo192.png',
        badge: '/badge.png',
        data: data.data || {}
      };
      
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (error) {
      console.error('[fcm-messaging-sw.js] Error handling push event:', error);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[fcm-messaging-sw.js] Notification click:', event);
  
  event.notification.close();
  
  // Handle click action
  const url = event.notification.data?.url || '/';
  
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
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[fcm-messaging-sw.js] Service worker loaded');
