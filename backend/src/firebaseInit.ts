import * as admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
// Only for local development, not in production/Firebase environment
if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLOUD_PROJECT) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Points to .env in the backend directory
}

// --- Firebase Initialization ---
let serviceAccountJson;
let initializedFrom = "";

try {
  if (process.env.FB_SERVICE_ACCOUNT_JSON) {
    serviceAccountJson = JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON);
    initializedFrom = "FB_SERVICE_ACCOUNT_JSON environment variable";
  } else {
    serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as any);
    initializedFrom = "FB_SERVICE_ACCOUNT_JSON environment variable";
  }

  // Initialize Firebase Admin
  // Check if already initialized to prevent errors, especially during hot-reloading in development
  if (!admin.apps.length) {
  // Prefer default credentials in Firebase/Google Cloud environment
    if (process.env.GOOGLE_CLOUD_PROJECT && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FORCED) {
      // The !process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FORCED is a way to override if needed, but generally not.
      admin.initializeApp();
      initializedFrom = "default credentials for Firebase/Google Cloud environment";
    } else if (process.env.FB_SERVICE_ACCOUNT_JSON) {
      serviceAccountJson = JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
      initializedFrom = "FB_SERVICE_ACCOUNT_JSON environment variable";
    } else {
      // Fallback to local file for development (if no env var is set and not in GCP)
      const serviceAccountPath = path.resolve(__dirname, '../../shavzak-firebase-adminsdk.json');
      console.log(`Firebase Admin SDK: Attempting to load credentials from local file: ${serviceAccountPath}`);
      serviceAccountJson = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
      initializedFrom = `local file (${serviceAccountPath})`;
    }
    console.log(`Firebase Admin SDK: Successfully initialized with credentials from ${initializedFrom}.`);
  
  } else {
    admin.app(); // if already initialized, use that one
    console.log(`Firebase Admin SDK: Was already initialized. Using existing app instance (likely initialized from ${initializedFrom}).`);
  }
} catch (error) {
  console.error('CRITICAL: Error initializing Firebase Admin SDK. Application will not work correctly.');
  console.error('Details:', error);
  console.error('Please ensure your shavzak-firebase-adminsdk.json file is correctly placed at the project root for local development,');
  console.error('OR that the FB_SERVICE_ACCOUNT_JSON environment variable is correctly set (e.g., in your .env file or deployment environment if not using default credentials).');
  process.exit(1);
}

export const db = admin.firestore(); // Export the initialized Firestore instance