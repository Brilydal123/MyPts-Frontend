// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { Messaging } from 'firebase/messaging';

// Extend Window interface to include firebase
declare global {
  interface Window {
    firebase?: {
      app: () => FirebaseApp;
    };
  }
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Use environment variables if available, otherwise use the actual values
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvonBWaHDTMFjyN7QBA9M50F1u621vYc0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mypts-6a894.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mypts-6a894",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mypts-6a894.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1080632618681",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1080632618681:web:0e155eaa624e80b4a1f568",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VWPJWY520R"
};

// Log Firebase configuration for debugging (without sensitive values)
console.log('Firebase configuration:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not set',
  appId: firebaseConfig.appId ? 'Set' : 'Not set'
});

// Initialize Firebase
let firebaseApp: FirebaseApp;

// Function to initialize Firebase
const initializeFirebase = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not initializing Firebase in server environment');
      return null;
    }

    // Check if we already have apps initialized
    const apps = getApps();
    if (apps.length > 0) {
      console.log('Using existing Firebase app');
      return apps[0];
    }

    // Initialize a new Firebase app
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully with config:', {
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      isProduction: typeof window !== 'undefined' &&
                   window.location.hostname !== 'localhost' &&
                   window.location.hostname !== '127.0.0.1'
    });
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);

    // If the error is about the app already existing, get the existing app
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('App already exists, getting existing Firebase app');
      const apps = getApps();
      if (apps.length > 0) {
        return apps[0];
      }
    }

    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Return null to indicate initialization failed
    return null;
  }
};

// Initialize Firebase
try {
  firebaseApp = initializeFirebase() as FirebaseApp;

  // If initialization failed, create a dummy app for development
  if (!firebaseApp) {
    console.warn('Firebase initialization failed, creating dummy app');
    firebaseApp = {} as FirebaseApp;
  }

  // Add a global reference for debugging
  if (typeof window !== 'undefined') {
    (window as any).firebaseApp = firebaseApp;
  }
} catch (error) {
  console.error('Unexpected error during Firebase initialization:', error);
  firebaseApp = {} as FirebaseApp;
}

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  try {
    // Make sure service workers are supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    // Make sure push is supported
    if (!('PushManager' in window)) {
      throw new Error('Push API is not supported in this browser');
    }

    // We'll initialize messaging later when needed
    console.log('Firebase messaging will be initialized when needed');
  } catch (error) {
    console.error('Error checking Firebase messaging prerequisites:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

export { firebaseApp, messaging };

export default { firebaseApp, messaging };
