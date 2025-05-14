import * as admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
// This should be one of the first things your application does.
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Assuming .env is in the backend root

// Construct the absolute path to the service account key file
// This assumes your service account key (e.g., shavzak-firebase-adminsdk.json) 
// is located in the project root: /Users/dvircooper/projects/shavzak/
// Adjust the path if your key is located elsewhere.
let serviceAccountJson;
let initializedFrom = "";

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializedFrom = "FIREBASE_SERVICE_ACCOUNT_JSON environment variable";
  } else {
    const serviceAccountPath = path.resolve(__dirname, '../../shavzak-firebase-adminsdk.json');
    serviceAccountJson = require(serviceAccountPath);
    initializedFrom = `local file (${serviceAccountPath})`;
  }

  // Initialize Firebase Admin
  // Check if already initialized to prevent errors, especially during hot-reloading in development
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
    });
    console.log(`Firebase Admin SDK: Successfully initialized with credentials from ${initializedFrom}.`);
  } else {
    admin.app(); // if already initialized, use that one
    console.log(`Firebase Admin SDK: Was already initialized. Using existing app instance (likely initialized from ${initializedFrom}).`);
  }
} catch (error) {
  console.error('CRITICAL: Error initializing Firebase Admin SDK. Application will not work correctly.');
  console.error('Details:', error);
  console.error('Please ensure your shavzak-firebase-adminsdk.json file is correctly placed at the project root for local development,');
  console.error('OR that the FIREBASE_SERVICE_ACCOUNT_JSON environment variable is correctly set (e.g., in your .env file or deployment environment).');
  process.exit(1);
}

export const db = admin.firestore(); // Export the initialized Firestore instance