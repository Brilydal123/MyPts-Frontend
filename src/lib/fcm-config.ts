// FCM Configuration
// This is a dedicated configuration file for Firebase Cloud Messaging

import { initializeApp, FirebaseApp, getApps, deleteApp } from 'firebase/app';
import { getMessaging, Messaging, getToken } from 'firebase/messaging';

// FCM configuration
const fcmConfig = {
  apiKey: "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
  authDomain: "mypts-6a894.firebaseapp.com",
  projectId: "mypts-6a894",
  storageBucket: "mypts-6a894.appspot.com",
  messagingSenderId: "1080632618681",
  appId: "1:1080632618681:web:0e155eaa624e80b4a1f568"
};

// Initialize Firebase for FCM
let fcmApp: FirebaseApp | null = null;
let fcmMessaging: Messaging | null = null;

// Initialize FCM
export const initializeFCM = async (): Promise<Messaging> => {
  try {
    // Clean up any existing apps
    const existingApps = getApps();
    for (const app of existingApps) {
      await deleteApp(app);
    }
    
    // Initialize a new app
    fcmApp = initializeApp(fcmConfig, 'fcm-app');
    console.log('FCM app initialized');
    
    // Initialize messaging
    fcmMessaging = getMessaging(fcmApp);
    console.log('FCM messaging initialized');
    
    return fcmMessaging;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    throw error;
  }
};

// Get FCM token
export const getFCMTokenWithVapidKey = async (vapidKey: string): Promise<string> => {
  try {
    // Make sure FCM is initialized
    if (!fcmMessaging) {
      await initializeFCM();
    }
    
    if (!fcmMessaging) {
      throw new Error('FCM messaging not initialized');
    }
    
    // Get service worker registration
    const swRegistration = await navigator.serviceWorker.ready;
    
    // Get token
    const token = await getToken(fcmMessaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration
    });
    
    if (!token) {
      throw new Error('Failed to get FCM token');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
};

export default {
  initializeFCM,
  getFCMTokenWithVapidKey
};
