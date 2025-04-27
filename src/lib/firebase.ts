// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Use environment variables if available, otherwise use placeholder values for development
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDevelopmentKeyPlaceholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "my-pts-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "my-pts-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "my-pts-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MEASUREMENT_ID"
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
  firebaseApp = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a dummy app for development
  firebaseApp = {} as FirebaseApp;
}

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(firebaseApp);
    console.log('Firebase messaging initialized');
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
  }
}

export { firebaseApp, messaging };

export default { firebaseApp, messaging };
