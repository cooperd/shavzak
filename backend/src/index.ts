// Initialize Firebase Admin SDK first
import express from 'express';
import cors from 'cors';
import './firebaseInit'; // Ensures db is initialized
import * as functions from 'firebase-functions';

import employeeRoutes from './routes/employeeRoutes'; // Import the employee routes
import scheduleRoutes from './routes/scheduleRoutes';
// The other route imports (mainRoutes, onCallRoutes, finalizeScheduleRoutes) seem to be from a different version or not currently used based on the API setup below.
// If they are needed, ensure they are correctly integrated.

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes. Configure more restrictively if needed.
app.use(express.json()); // To parse JSON request bodies

// API Routes
app.use('/api', employeeRoutes); // Use the employee routes, prefixed with /api
app.use('/api', scheduleRoutes); // Use the schedule routes, prefixed with /api
// If onCallRoutes and finalizeScheduleRoutes are still needed, add them here:
// app.use('/api', onCallRoutes);
// app.use('/api', finalizeScheduleRoutes);

// Serving static files and SPA fallback will be handled by Firebase Hosting,
// not by the Express app when deployed as a function.

// For local development using `npm run dev` (nodemon)
// This block will not run when deployed as a Firebase Function
if (!process.env.FUNCTIONS_EMULATOR && !process.env.K_SERVICE) {
  const PORT = process.env.PORT || 3001; // Default to 3001 for local backend dev
  app.listen(PORT, () => {
    console.log(`Backend server running locally on http://localhost:${PORT}`);
  });
}

// Export the Express app as an HTTPS function
// The name 'api' here should match the function name in firebase.json rewrites.
export const api = functions.region('us-central1') // TODO: Choose your preferred region
                          .runWith({ memory: '512MB', timeoutSeconds: 60 }) // Optional: Adjust resources
                          .https.onRequest(app);