import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
// Adjust the import path if your config.ts is located elsewhere relative to this script
import { EMPLOYEES_COLLECTION } from '../src/config';

// --- Configuration ---
// Path to your Firebase service account key JSON file
// This assumes the script is in /Users/dvircooper/projects/shavzak/backend/scripts/
// and the key is in /Users/dvircooper/projects/shavzak/
const serviceAccountPath = path.resolve(__dirname, '../../shavzak-firebase-adminsdk.json');
const employeesJsonPath = path.resolve(__dirname, '../../db/employees.json');

// Define the structure of an employee from the JSON file
interface EmployeeFromJson {
  id: string;
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

// --- Firebase Initialization ---
try {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.error(`Failed to load service account key from: ${serviceAccountPath}`);
  console.error('Please ensure the path is correct and the file exists.');
  process.exit(1); // Exit if Firebase cannot be initialized
}

const db = admin.firestore();

// --- Employee Data Structure (for adding to Firestore) ---
interface NewEmployeeData {
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

// --- Migration Logic ---
async function migrateEmployees() {
  console.log(`Starting employee migration to collection: '${EMPLOYEES_COLLECTION}'...`);
 let employeesToMigrate: EmployeeFromJson[];
  try {
    const jsonData = fs.readFileSync(employeesJsonPath, 'utf-8');
    employeesToMigrate = JSON.parse(jsonData);
    console.log(`Successfully read ${employeesToMigrate.length} employees from ${employeesJsonPath}`);
  } catch (error) {
    console.error(`Error reading or parsing ${employeesJsonPath}:`, error);
    process.exit(1);
  }


  const employeesCollectionRef = db.collection(EMPLOYEES_COLLECTION);
  let existingEmployeesSnapshot;
  try {
    existingEmployeesSnapshot = await employeesCollectionRef.get();
  } catch (error) {
    console.error('Error fetching existing employees from Firestore:', error);
    return; // Stop migration if we can't read existing employees
  }

  const existingEmployeeNames = new Set<string>();
  existingEmployeesSnapshot.forEach(doc => {
    const employee = doc.data();
    if (employee.name) {
      existingEmployeeNames.add(employee.name.trim().toLowerCase());
    }
  });

  console.log(`Found ${existingEmployeeNames.size} existing employees.`);

  let employeesAddedCount = 0;
  let employeesSkippedCount = 0;

  for (const emp of employeesToMigrate) {
    const trimmedName = emp.name ? emp.name.trim() : '';
    const employeeId = emp.id ? emp.id.trim() : '';
    if (trimmedName === '') {
      console.warn('Skipping employee with empty name.');
      continue;
    }

    if (existingEmployeeNames.has(trimmedName.toLowerCase())) {
      console.log(`Employee "${trimmedName}" already exists. Skipping.`);
      employeesSkippedCount++;
    } else {
      const newEmployee: NewEmployeeData = {
        name: trimmedName,
        total_shifts_assigned: emp.total_shifts_assigned || 0,
        total_day_shifts_assigned: emp.total_day_shifts_assigned || 0,
        total_night_shifts_assigned: emp.total_night_shifts_assigned || 0,
      };

      try {
        const docRef = await employeesCollectionRef.add(newEmployee);
        console.log(`Added employee "${trimmedName}" with ID: ${docRef.id}`);
        employeesAddedCount++;
      } catch (error) {
        console.error(`Error adding employee "${trimmedName}":`, error);
      }
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Employees processed: ${employeesToMigrate.length}`);
  console.log(`Employees added: ${employeesAddedCount}`);
  console.log(`Employees skipped (already exist): ${employeesSkippedCount}`);
  console.log('Migration complete.');
}

// --- Run the migration ---
migrateEmployees()
  .then(() => {
    console.log('Script finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during migration:', error);
    process.exit(1);
  });