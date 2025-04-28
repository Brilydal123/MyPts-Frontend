// FCM Configuration
// This is a dedicated configuration file for Firebase Cloud Messaging

import { initializeApp, FirebaseApp, getApps, deleteApp } from 'firebase/app';
import { getMessaging, Messaging, getToken } from 'firebase/messaging';

// FCM configuration
const fcmConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mypts-6a894.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mypts-6a894",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mypts-6a894.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1080632618681",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1080632618681:web:0e155eaa624e80b4a1f568"
};

// Initialize Firebase for FCM
let fcmApp: FirebaseApp | null = null;
let fcmMessaging: Messaging | null = null;

// Initialize FCM
export const initializeFCM = async (): Promise<Messaging> => {
  try {
    console.log('Initializing FCM...');

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not initializing FCM in server environment');
      throw new Error('Cannot initialize FCM in server environment');
    }

    // Check if we're in production or development
    const isProduction = window.location.hostname !== 'localhost' &&
                         window.location.hostname !== '127.0.0.1';
    console.log(`Environment for FCM: ${isProduction ? 'Production' : 'Development'}`);

    // Check if we already have an FCM app initialized
    if (fcmApp && fcmMessaging) {
      console.log('Using existing FCM app and messaging');
      return fcmMessaging;
    }

    // Check if we have any existing Firebase apps
    const existingApps = getApps();
    console.log(`Found ${existingApps.length} existing Firebase apps`);

    // If we have existing apps, try to use one of them
    let app: FirebaseApp;
    if (existingApps.length > 0) {
      // Look for an app with the name 'fcm-app'
      const existingFcmApp = existingApps.find(a => a.name === 'fcm-app');
      if (existingFcmApp) {
        console.log('Using existing FCM app');
        app = existingFcmApp;
      } else {
        // If no FCM app exists, create a new one with a unique name
        console.log('Creating new FCM app with unique name');
        app = initializeApp(fcmConfig, `fcm-app-${Date.now()}`);
      }
    } else {
      // If no apps exist, create a new one
      console.log('No existing apps, creating new FCM app');
      app = initializeApp(fcmConfig, 'fcm-app');
    }

    // Store the app reference
    fcmApp = app;
    console.log('FCM app initialized:', app.name);

    // Initialize messaging
    try {
      fcmMessaging = getMessaging(fcmApp);
      console.log('FCM messaging initialized successfully');
    } catch (messagingError) {
      console.error('Error initializing FCM messaging:', messagingError);

      // Try to initialize messaging with the default app if available
      if (existingApps.length > 0 && existingApps[0].name === '[DEFAULT]') {
        console.log('Trying to initialize messaging with default app');
        fcmMessaging = getMessaging(existingApps[0]);
        console.log('FCM messaging initialized with default app');
      } else {
        throw messagingError;
      }
    }

    return fcmMessaging;
  } catch (error) {
    console.error('Error initializing FCM:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }

    throw error;
  }
};

// Get FCM token
export const getFCMTokenWithVapidKey = async (vapidKey: string): Promise<string> => {
  try {
    console.log('Getting FCM token with VAPID key:', vapidKey ? `${vapidKey.substring(0, 10)}...` : 'Missing');

    if (!vapidKey) {
      throw new Error('VAPID key is required for FCM token generation');
    }

    // Make sure FCM is initialized
    if (!fcmMessaging) {
      console.log('FCM messaging not initialized, initializing now...');
      await initializeFCM();
    }

    if (!fcmMessaging) {
      throw new Error('FCM messaging not initialized after initialization attempt');
    }

    // Make sure service worker is registered
    console.log('Checking service worker registration...');
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    // Wait for service worker to be ready
    console.log('Waiting for service worker to be ready...');
    const swRegistration = await navigator.serviceWorker.ready;
    console.log('Service worker is ready:', swRegistration.active?.scriptURL);

    // Get token with retry mechanism
    console.log('Getting FCM token...');
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const token = await getToken(fcmMessaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });

        if (!token) {
          throw new Error('Empty token received from Firebase');
        }

        console.log('FCM token received successfully:', token.substring(0, 10) + '...');
        return token;
      } catch (tokenError) {
        retryCount++;
        console.warn(`Error getting token (attempt ${retryCount}/${maxRetries}):`, tokenError);

        if (retryCount < maxRetries) {
          // Wait before retrying
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // Re-initialize FCM before retrying
          try {
            await initializeFCM();
          } catch (reinitError) {
            console.warn('Error re-initializing FCM:', reinitError);
          }
        } else {
          throw new Error(`Failed to get FCM token after ${maxRetries} attempts: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
        }
      }
    }

    throw new Error('Failed to get FCM token after all retry attempts');
  } catch (error) {
    console.error('Error getting FCM token:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }

    throw error;
  }
};

export default {
  initializeFCM,
  getFCMTokenWithVapidKey
};
