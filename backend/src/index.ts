import express from 'express';
import path from 'path';
import { db } from './firebaseInit'; // This ensures Firebase is initialized when the server starts

import employeeRoutes from './routes/employeeRoutes'; // Import the employee routes
import scheduleRoutes from './routes/scheduleRoutes';
import mainRoutes from './routes/mainRoutes'; // Import the main routes
import onCallRoutes from './routes/onCallRoutes';
import finalizeScheduleRoutes from './routes/finalizeScheduleRoutes';

const app = express();
const PORT = process.env.PORT || 4000; // Use environment variable for port or default to 5000

// Middleware
app.use(express.json()); // To parse JSON request bodies

// Serve static files from the frontend build directory
// This path assumes your 'frontend' directory is a sibling to your 'backend' directory
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// API Routes (to be added later)
app.use('/api', employeeRoutes); // Use the employee routes, prefixed with /api
app.use('/api', scheduleRoutes); // Use the schedule routes, prefixed with /api
app.use('/api', onCallRoutes); // All routes in onCallRoutes will be prefixed with /api
app.use('/api', finalizeScheduleRoutes); // All routes in finalizeScheduleRoutes will be prefixed with /api
app.use('/', mainRoutes); // Use the main routes (handles root and /api/on_call, /api/finalize_schedule)

// SPA Fallback: For any route not matched by API or static files, serve index.html
app.get('/*splat', (req, res) => {
  res.sendFile(path.resolve(frontendDistPath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Node.js backend server is listening on port ${PORT}`);
  console.log(`Serving static files from: ${frontendDistPath}`);
});