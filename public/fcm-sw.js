// Simple service worker for FCM
self.addEventListener('install', (event) => {
  console.log('[fcm-sw.js] Service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[fcm-sw.js] Service worker activated');
  // Claim all clients to ensure the service worker is controlling the page
  event.waitUntil(clients.claim());
});

// This is a minimal service worker that will be used just for FCM
console.log('[fcm-sw.js] Service worker loaded');
