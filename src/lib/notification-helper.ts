/**
 * Cross-platform notification helper
 * This handles the differences between desktop and mobile notification APIs
 */

/**
 * Show a notification using the appropriate method for the current platform
 * On desktop, this uses the Notification constructor
 * On mobile, this uses ServiceWorkerRegistration.showNotification()
 */
export async function showNotification(
  title: string,
  options: ExtendedNotificationOptions = {}
): Promise<boolean> {
  try {
    // Check if notifications are supported and permission is granted
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    // First try to get the service worker registration
    try {
      const registration = await navigator.serviceWorker.ready;

      // Use the service worker to show the notification
      // Create a notification options object that's compatible with ServiceWorkerRegistration.showNotification
      const notificationOptions: any = {
        ...options,
        // Ensure we have a badge for mobile
        badge: options.badge || '/badge.png'
      };

      // Add vibration pattern for mobile if supported
      if (options.vibrate) {
        notificationOptions.vibrate = options.vibrate;
      } else {
        notificationOptions.vibrate = [100, 50, 100];
      }

      await registration.showNotification(title, notificationOptions);

      console.log('Notification shown via service worker');
      return true;
    } catch (swError) {
      console.warn('Error showing notification via service worker:', swError);

      // If service worker approach fails, try the direct approach (desktop only)
      if ('Notification' in window && typeof Notification.constructor === 'function') {
        try {
          const notification = new Notification(title, options);

          // Auto-close the notification after a delay if closeAfter is specified
          if (options.closeAfter && typeof options.closeAfter === 'number') {
            setTimeout(() => notification.close(), options.closeAfter);
          }

          console.log('Notification shown via direct constructor');
          return true;
        } catch (directError) {
          console.error('Error showing notification via direct constructor:', directError);
          return false;
        }
      }

      return false;
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Extended notification options with additional properties
 */
export interface ExtendedNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: { action: string; title: string; icon?: string }[];
  silent?: boolean;
  timestamp?: number;
  closeAfter?: number; // Auto-close the notification after this many milliseconds
}

/**
 * Request notification permission in a way that works across platforms
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  // If already granted, return immediately
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // If already denied, return immediately
  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);

    // Try the callback approach for older browsers
    return new Promise((resolve) => {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
    });
  }
}

/**
 * Reset notification permissions by clearing service worker registrations
 * This is useful when notification permissions are in a bad state
 */
export async function resetNotificationPermissions(): Promise<void> {
  try {
    console.log('Resetting notification permissions...');

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported, cannot reset permissions');
      return;
    }

    // Get all service worker registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker registrations`);

    // Unregister all service workers
    for (const registration of registrations) {
      try {
        const result = await registration.unregister();
        console.log(`Unregistered service worker ${registration.scope}: ${result}`);
      } catch (error) {
        console.error(`Error unregistering service worker ${registration.scope}:`, error);
      }
    }

    // Clear any cached data
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches`);

        for (const cacheName of cacheNames) {
          if (cacheName.includes('firebase') || cacheName.includes('notification') || cacheName.includes('push')) {
            await caches.delete(cacheName);
            console.log(`Deleted cache: ${cacheName}`);
          }
        }
      }
    } catch (cacheError) {
      console.error('Error clearing caches:', cacheError);
    }

    console.log('Notification permissions reset complete');

    // Reload the page to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error resetting notification permissions:', error);
    throw error;
  }
}

export default {
  showNotification,
  requestNotificationPermission,
  resetNotificationPermissions
};
