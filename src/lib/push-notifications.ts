import { apiClient } from './api/api-client';

// Check if the browser supports push notifications
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request permission for push notifications
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  return await Notification.requestPermission();
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushNotificationSupported()) {
    throw new Error('Service workers are not supported in this browser');
  }

  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
};

// Get the FCM token
export const getFCMToken = async (vapidKey: string): Promise<string> => {
  try {
    // Import Firebase messaging dynamically to avoid SSR issues
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { firebaseApp } = await import('./firebase') as { firebaseApp: import('firebase/app').FirebaseApp };

    if (!firebaseApp) {
      throw new Error('Firebase app not initialized');
    }

    const messaging = getMessaging(firebaseApp);
    return await getToken(messaging, { vapidKey });
  } catch (error: any) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
};

// Register the device with the backend
export const registerDevice = async (token: string, deviceName?: string, deviceType?: string) => {
  try {
    const response = await apiClient.post('/user/devices/register', {
      token,
      deviceName: deviceName || navigator.userAgent,
      deviceType: deviceType || detectDeviceType()
    });

    return response.data;
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
};

// Get all registered devices
export const getUserDevices = async () => {
  try {
    const response = await apiClient.get('/user/devices');
    return response.data;
  } catch (error) {
    console.error('Error getting user devices:', error);
    throw error;
  }
};

// Unregister a device
export const unregisterDevice = async (deviceId: string) => {
  try {
    const response = await apiClient.delete(`/user/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error unregistering device:', error);
    throw error;
  }
};

// Test push notification for a device
export const testPushNotification = async (deviceId: string) => {
  try {
    const response = await apiClient.post(`/user/devices/${deviceId}/test`);
    return response.data;
  } catch (error) {
    console.error('Error testing push notification:', error);
    throw error;
  }
};

// Helper function to detect device type
const detectDeviceType = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/i.test(userAgent)) {
    return 'smartphone';
  }

  if (/iphone|ipod/i.test(userAgent)) {
    return 'smartphone';
  }

  if (/ipad/i.test(userAgent)) {
    return 'tablet';
  }

  if (/tablet|playbook|silk|android(?!.*mobile)/i.test(userAgent)) {
    return 'tablet';
  }

  if (/windows phone/i.test(userAgent)) {
    return 'smartphone';
  }

  return 'desktop';
};

// Initialize push notifications
export const initializePushNotifications = async (vapidKey: string): Promise<string | null> => {
  try {
    console.log('Initializing push notifications...');

    if (!isPushNotificationSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return null;
    }

    console.log('Push notifications are supported, requesting permission...');
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    console.log('Permission granted, registering service worker...');
    try {
      await registerServiceWorker();
      console.log('Service worker registered successfully');
    } catch (swError) {
      console.error('Error registering service worker:', swError);
      // Continue anyway, as the service worker might already be registered
    }

    console.log('Getting FCM token with VAPID key:', vapidKey ? 'Provided' : 'Missing');
    let token;
    try {
      token = await getFCMToken(vapidKey);
      console.log('FCM token obtained:', token ? 'Success' : 'Failed');
    } catch (error: any) {
      console.error('Error getting FCM token:', error);
      throw new Error('Failed to get FCM token: ' + (error.message || 'Unknown error'));
    }

    if (token) {
      console.log('Registering device with token...');
      try {
        await registerDevice(token);
        console.log('Device registered for push notifications');
        return token;
      } catch (error: any) {
        console.error('Error registering device with backend:', error);
        throw new Error('Failed to register device with backend: ' + (error.message || 'Unknown error'));
      }
    } else {
      throw new Error('Failed to get FCM token');
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    throw error; // Re-throw to allow the component to handle the error
  }
};
