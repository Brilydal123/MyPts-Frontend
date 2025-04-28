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

  // Check current permission
  const currentPermission = Notification.permission;
  console.log('Current notification permission:', currentPermission);

  try {
    // Always request permission to ensure the browser shows the prompt
    // This is important because some browsers might not show the prompt
    // if the permission state is 'default' but was previously interacted with
    console.log('Directly calling Notification.requestPermission()');

    // Use the promise-based API for modern browsers
    const newPermission = await Notification.requestPermission();
    console.log('Permission after direct request:', newPermission);

    // If we got a permission, return it
    if (newPermission) {
      return newPermission;
    }
  } catch (error) {
    console.error('Error with promise-based permission request:', error);

    // Try the callback-based API for older browsers
    try {
      return new Promise<NotificationPermission>((resolve) => {
        console.log('Trying callback-based Notification.requestPermission()');
        Notification.requestPermission(function(permission) {
          console.log('Permission from callback:', permission);
          resolve(permission);
        });
      });
    } catch (callbackError) {
      console.error('Error with callback-based permission request:', callbackError);
      // If all else fails, return the current permission
    }
  }

  // Return current permission if all request attempts fail
  return currentPermission;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushNotificationSupported()) {
    throw new Error('Service workers are not supported in this browser');
  }

  try {
    console.log('Registering service worker...');

    // First, unregister any existing service workers to ensure a clean state
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of existingRegistrations) {
        console.log('Unregistering existing service worker:', registration.scope);
        await registration.unregister();
      }
      console.log('Existing service workers unregistered');
    } catch (unregError) {
      console.warn('Error unregistering existing service workers:', unregError);
      // Continue anyway
    }

    // Wait a moment to ensure unregistration is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we're in production or development
    const isProduction = typeof window !== 'undefined' &&
                        window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1';
    console.log(`Environment for service worker: ${isProduction ? 'Production' : 'Development'}`);

    // Register our Firebase messaging service worker
    console.log('Registering Firebase messaging service worker...');

    // Create a URL with Firebase configuration for the service worker
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mypts-6a894",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1080632618681",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1080632618681:web:0e155eaa624e80b4a1f568"
    };

    // Create a URL with the configuration as a query parameter
    const swUrl = new URL('/firebase-messaging-sw.js', window.location.origin);
    swUrl.searchParams.set('firebaseConfig', JSON.stringify(firebaseConfig));
    swUrl.searchParams.set('v', Date.now().toString()); // Add cache buster

    console.log(`Registering service worker from: ${swUrl.pathname}`);
    const fcmRegistration = await navigator.serviceWorker.register(swUrl.toString(), {
      scope: '/'
    });

    console.log('Firebase messaging service worker registered, waiting for activation...');

    // Wait for the service worker to be activated
    if (fcmRegistration.installing) {
      console.log('FCM service worker is installing, waiting for activation...');
      await new Promise<void>(resolve => {
        const stateChangeHandler = (event: Event) => {
          const sw = event.target as ServiceWorker;
          console.log('FCM service worker state changed:', sw.state);

          if (sw.state === 'activated') {
            console.log('FCM service worker activated');
            fcmRegistration.installing?.removeEventListener('statechange', stateChangeHandler);
            resolve();
          }
        };

        // Add the event listener safely
        if (fcmRegistration.installing) {
          fcmRegistration.installing.addEventListener('statechange', stateChangeHandler);
        } else {
          console.warn('FCM service worker is not installing, resolving immediately');
          resolve();
        }

        // Also set a timeout in case the event doesn't fire
        setTimeout(() => {
          fcmRegistration.installing?.removeEventListener('statechange', stateChangeHandler);
          console.log('Timed out waiting for FCM service worker activation, continuing anyway');
          resolve();
        }, 3000);
      });
    }

    // Wait for the service worker to control the page
    if (!navigator.serviceWorker.controller) {
      console.log('Waiting for service worker to control the page...');
      await new Promise<void>(resolve => {
        const controllerChangeHandler = () => {
          console.log('Service worker now controlling the page');
          resolve();
        };

        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler, { once: true });

        // Also set a timeout in case the event doesn't fire
        setTimeout(() => {
          console.log('Timed out waiting for service worker to control the page, continuing anyway');
          resolve();
        }, 3000);
      });
    }

    console.log('Service worker registration complete');
    return fcmRegistration;
  } catch (error) {
    console.error('Service worker registration failed:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }

    throw error;
  }
};

// Get the FCM token
export const getFCMToken = async (vapidKey: string): Promise<string> => {
  try {
    console.log('Getting FCM token with VAPID key:', vapidKey ? vapidKey.substring(0, 10) + '...' : 'Missing');

    if (!vapidKey) {
      throw new Error('VAPID key is required for FCM token generation');
    }

    // Make sure service worker is registered and active before getting token
    try {
      // Register our simple service worker
      await registerServiceWorker();
      console.log('Service worker registered before getting FCM token');
    } catch (swError) {
      console.warn('Service worker registration warning:', swError);
      // Continue anyway, as the service worker might already be registered
    }

    // Import the dedicated FCM configuration
    const { initializeFCM, getFCMTokenWithVapidKey } = await import('./fcm-config');

    // Initialize FCM
    try {
      await initializeFCM();
      console.log('FCM initialized successfully');
    } catch (fcmError) {
      console.error('Error initializing FCM:', fcmError);
      throw new Error(`Failed to initialize FCM: ${fcmError instanceof Error ? fcmError.message : String(fcmError)}`);
    }

    // Wait a moment to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Getting FCM token...');

    // Try to get the token with a retry mechanism
    let token: string | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    while (!token && retryCount < maxRetries) {
      try {
        // Get the token using the dedicated function
        token = await getFCMTokenWithVapidKey(vapidKey);

        if (token) {
          console.log('FCM token received successfully:', token.substring(0, 10) + '...');
          return token;
        } else {
          throw new Error('Empty token received from Firebase');
        }
      } catch (error) {
        retryCount++;
        // Cast to Error to fix TypeScript error
        const tokenError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Error getting token (attempt ${retryCount}/${maxRetries}):`, tokenError);

        if (retryCount < maxRetries) {
          // Exponential backoff: wait longer between each retry
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // Try to re-register the service worker before retrying
          try {
            await registerServiceWorker();
            // Wait a moment for it to activate
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Re-initialize FCM
            await initializeFCM();
          } catch (reRegError) {
            console.warn('Error re-registering service worker or re-initializing FCM:', reRegError);
          }
        } else {
          throw new Error(`Failed to get FCM token after ${maxRetries} attempts: ${tokenError.message}`);
        }
      }
    }

    throw new Error('No FCM token received from Firebase after retries');
  } catch (error: any) {
    console.error('Error getting FCM token:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }

    throw error;
  }
};

// Cache for device registration to avoid multiple registrations
let deviceRegistrationCache: any = null;
let deviceRegistrationPromise: Promise<any> | null = null;
const DEVICE_REGISTRATION_CACHE_KEY = 'device_registration';
const DEVICE_REGISTRATION_TIMESTAMP_KEY = 'device_registration_timestamp';
const DEVICE_REGISTRATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Register the device with the backend
export const registerDevice = async (token: string, deviceName?: string, deviceType?: string) => {
  try {
    // Check if we have a cached registration in memory
    if (deviceRegistrationCache && deviceRegistrationCache.token === token) {
      console.log('Using in-memory cached device registration');
      return deviceRegistrationCache;
    }

    // Check if we have a cached registration in localStorage
    const cachedRegistration = localStorage.getItem(DEVICE_REGISTRATION_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(DEVICE_REGISTRATION_TIMESTAMP_KEY);

    if (cachedRegistration && cachedTimestamp) {
      const registration = JSON.parse(cachedRegistration);
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();

      // Use cached registration if it's not expired and the token matches
      if (now - timestamp < DEVICE_REGISTRATION_EXPIRY && registration.token === token) {
        console.log('Using localStorage cached device registration');
        deviceRegistrationCache = registration;
        return registration;
      } else {
        console.log('Cached device registration expired or token changed, registering again');
      }
    }

    // If we're already registering, return the promise
    if (deviceRegistrationPromise) {
      console.log('Device registration already in progress, waiting...');
      return deviceRegistrationPromise;
    }

    // Create a new registration promise
    deviceRegistrationPromise = (async () => {
      try {
        console.log('Registering device with token:', token.substring(0, 10) + '...');

        const response = await apiClient.post('/user/devices/register', {
          token,
          deviceName: deviceName || navigator.userAgent,
          deviceType: deviceType || detectDeviceType()
        });

        // Cache the registration
        const registrationData = response.data;
        deviceRegistrationCache = registrationData;
        localStorage.setItem(DEVICE_REGISTRATION_CACHE_KEY, JSON.stringify(registrationData));
        localStorage.setItem(DEVICE_REGISTRATION_TIMESTAMP_KEY, Date.now().toString());

        return registrationData;
      } catch (error) {
        console.error('Error registering device:', error);
        throw error;
      } finally {
        // Clear the promise so we can try again if needed
        deviceRegistrationPromise = null;
      }
    })();

    return deviceRegistrationPromise;
  } catch (error) {
    console.error('Error in registerDevice:', error);
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
    console.log(`Testing push notification for device ID: ${deviceId}`);

    // First, verify that Firebase is properly initialized
    try {
      const { firebaseApp } = await import('./firebase');
      console.log('Firebase app initialized:', !!firebaseApp);

      if (!firebaseApp) {
        console.warn('Firebase app not initialized, push notifications may not work');
      }
    } catch (firebaseError) {
      console.warn('Error checking Firebase initialization:', firebaseError);
    }

    // Try the standard endpoint first
    console.log(`Calling backend API endpoint: /user/devices/${deviceId}/test`);
    try {
      const response = await apiClient.post(`/user/devices/${deviceId}/test`);
      console.log('Backend API response:', response.data);
      return response.data;
    } catch (endpointError: any) {
      console.error('Error with standard endpoint:', endpointError);

      // If we get a 400 error, try the direct test method
      if (endpointError.response?.status === 400) {
        console.log('Falling back to direct push notification test...');

        // Get the device details first
        console.log('Fetching device details...');
        const devicesResponse = await getUserDevices();
        console.log(`Found ${devicesResponse.devices?.length || 0} devices`);

        const device = devicesResponse.devices?.find((d: any) => d.id === deviceId);

        if (device && device.pushToken) {
          console.log(`Found device with token: ${device.pushToken.substring(0, 10)}...`);

          // Try the direct test endpoint
          console.log('Calling direct test endpoint with token...');
          try {
            // First try the backend test endpoint
            const directBackendResponse = await apiClient.post('/test/notifications/push', {
              token: device.pushToken,
              title: 'Test Notification (Backend)',
              message: 'This is a test notification from MyPts Backend'
            });
            console.log('Direct backend test response:', directBackendResponse.data);
            return directBackendResponse.data;
          } catch (backendError: any) {
            console.error('Error with backend direct test:', backendError);

            // If backend fails, try the frontend API route
            console.log('Trying frontend API route...');
            try {
              const frontendResponse = await fetch('/api/test/notifications/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  token: device.pushToken,
                  title: 'Test Notification (Frontend)',
                  message: 'This is a test notification from MyPts Frontend'
                })
              });

              if (!frontendResponse.ok) {
                throw new Error(`Frontend API error: ${frontendResponse.status} ${frontendResponse.statusText}`);
              }

              const frontendData = await frontendResponse.json();
              console.log('Frontend API response:', frontendData);

              // Check if we need to show a local notification instead
              if (frontendData.showLocalNotification) {
                console.log('Showing local notification as instructed by API');

                // Show a local notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  const notification = new Notification('Test Notification (Local)', {
                    body: 'This is a local test notification from MyPts',
                    icon: '/logo192.png'
                  });

                  // Close the notification after 5 seconds
                  setTimeout(() => notification.close(), 5000);
                }
              }

              return frontendData;
            } catch (frontendError) {
              console.error('Error with frontend API route:', frontendError);

              // Show a local notification as fallback
              if ('Notification' in window && Notification.permission === 'granted') {
                console.log('Showing local notification as fallback');
                const notification = new Notification('Test Notification (Fallback)', {
                  body: 'This is a fallback notification from MyPts',
                  icon: '/logo192.png'
                });

                // Close the notification after 5 seconds
                setTimeout(() => notification.close(), 5000);
              }

              throw frontendError;
            }
          }
        } else {
          console.error('Device not found or has no push token');
          throw new Error('Device not found or has no push token');
        }
      }

      throw endpointError;
    }
  } catch (error: any) {
    console.error('All push notification test methods failed:', error);
    throw error;
  }
};

// Test push notification directly with a token
export const testPushNotificationWithToken = async (token: string) => {
  try {
    console.log(`Testing push notification with token: ${token.substring(0, 10)}...`);
    const response = await apiClient.post('/test/notifications/push', {
      token,
      title: 'Test Notification',
      message: 'This is a test notification from MyPts'
    });
    return response.data;
  } catch (error: any) {
    console.error('Error testing push notification with token:', error);
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

    // Always request permission to ensure the browser shows the prompt
    console.log('Push notifications are supported, requesting permission...');

    // Force a direct permission request to ensure the browser shows the prompt
    const permission = await requestNotificationPermission();
    console.log('Permission after request:', permission);

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // If we got here, permission is granted
    console.log('✅ Notification permission granted');

    console.log('Permission granted, registering service worker...');
    let serviceWorkerRegistration;
    try {
      serviceWorkerRegistration = await registerServiceWorker();
      console.log('Service worker registered successfully');
    } catch (swError) {
      console.error('Error registering service worker:', swError);
      // Try to get existing service worker registration
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        serviceWorkerRegistration = registrations.find(reg =>
          reg.active && reg.active.scriptURL.includes('firebase-messaging-sw.js')
        );

        if (serviceWorkerRegistration) {
          console.log('Using existing service worker registration');
        } else {
          throw new Error('No service worker registration found');
        }
      } catch (regError) {
        console.error('Failed to get service worker registration:', regError);
        throw new Error('Service worker registration failed and no existing registration found');
      }
    }

    console.log('Getting FCM token with VAPID key:', vapidKey ? vapidKey.substring(0, 10) + '...' : 'Missing');
    let token;
    try {
      token = await getFCMToken(vapidKey);
      console.log('FCM token obtained:', token ? token.substring(0, 10) + '...' : 'Failed');
    } catch (error: any) {
      console.error('Error getting FCM token:', error);
      throw new Error('Failed to get FCM token: ' + (error.message || 'Unknown error'));
    }

    if (token) {
      console.log('Registering device with token...');
      try {
        await registerDevice(token);
        console.log('Device registered for push notifications');

        // Test notification to verify everything is working
        try {
          // Create a test notification to verify permissions
          if ('Notification' in window && permission === 'granted') {
            const testNotification = new Notification('Push Notifications Enabled', {
              body: 'You will now receive notifications from MyPts',
              icon: '/logo192.png'
            });

            // Close the notification after 3 seconds
            setTimeout(() => testNotification.close(), 3000);
          }
        } catch (notifyError) {
          console.error('Error showing test notification:', notifyError);
          // Continue anyway, this is just a test
        }

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
