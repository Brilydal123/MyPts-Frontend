// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

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
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mymypts-6a894",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mypts-6a894.firebasestorage.app",
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
try {
  // Check if Firebase is already initialized
  if (typeof window !== 'undefined' && window.firebase) {
    console.log('Firebase already initialized, using existing instance');
    firebaseApp = window.firebase.app();
  } else {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);

  // If the error is about the app already existing, get the existing app
  if (error instanceof Error && error.message.includes('already exists')) {
    console.log('Using existing Firebase app');
    firebaseApp = initializeApp();
  } else {
    // Create a dummy app for development as a last resort
    console.warn('Creating dummy Firebase app as fallback');
    firebaseApp = {} as FirebaseApp;
  }
}

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(firebaseApp);
    console.log('Firebase messaging initialized successfully');

    // Test if messaging is working
    if (!messaging) {
      throw new Error('Messaging is null after initialization');
    }
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

export { firebaseApp, messaging };

export default { firebaseApp, messaging };
