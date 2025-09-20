import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export Firestore database instance
export const db = admin.firestore();

// Export Firebase Admin instance
export { admin };

// Export functions for use in other files
export { functions };

// Configure Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true
});

// Helper function to get environment variables
export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

// Helper function to check if running in production
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production' || 
         process.env.FUNCTIONS_EMULATOR !== 'true';
};

// Helper function to get region
export const getRegion = (): string => {
  return process.env.FIREBASE_REGION || 'us-central1';
}; 