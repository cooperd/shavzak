import * as admin from 'firebase-admin';
import path from 'path';

// Construct the absolute path to the service account key file
// This assumes your service account key (e.g., shavzak-firebase-adminsdk.json) 
// is located in the project root: /Users/dvircooper/projects/shavzak/
// Adjust the path if your key is located elsewhere.
const serviceAccountPath = path.resolve(__dirname, '../../shavzak-firebase-adminsdk.json');

// Initialize Firebase Admin
// Check if already initialized to prevent errors, especially during hot-reloading in development
if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath); // Using require for JSON is common in Node.js
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore(); // Export the initialized Firestore instance