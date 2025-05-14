# Shavzak - Shift Scheduler

Shavzak is a web application designed to help manage and generate weekly employee shift schedules. It allows for inputting employee preferences and constraints, and then attempts to create a balanced schedule.

## Features

*   **Employee Management**: Add, edit, and remove employees. View total shifts, day shifts, and night shifts assigned.
*   **Weekly Preferences Input**:
    *   Manually input preferences (0 for cannot work, 1 for preferred, empty for available) in a grid.
    *   Import preferences from a CSV file.
    *   Download a template CSV file pre-filled with employee names.
*   **Schedule Generation**:
    *   Generates a weekly schedule based on preferences and constraints.
    *   Supports assigning up to two employees per shift.
    *   Considers employee preferences (0, 1, empty).
    *   Aims for even distribution of shifts among employees.
    *   Prevents employees from working two shifts in a row (e.g., night then day, or day then night on the same day).
    *   Limits the maximum number of shifts an employee can be assigned per week.
*   **Schedule Display**: Shows the proposed weekly schedule alongside employee preferences for easy comparison.
*   **On-Call Rotation**: (Basic display, finalization advances it)
*   **Dashboard Interface**: Modern look and feel with a header and left-side navigation.

## Tech Stack

### Frontend

*   **React**: JavaScript library for building user interfaces.
*   **TypeScript**: Superset of JavaScript that adds static typing.
*   **Vite**: Fast frontend build tool and development server.
*   **Material-UI (MUI)**: React UI component library.
*   **React Router DOM**: For client-side routing.

### Backend

*   **Python**: Programming language.
*   **Flask**: Micro web framework for Python.
*   **JSON files**: Used as a simple database for storing employee data, on-call rotation, etc.

## Project Structure

```
shavzak/
├── backend/             # All Python Flask server code
│   ├── routes/          # Blueprint route definitions
│   ├── app.py           # Main Flask application setup
│   ├── config.py        # Configuration constants
│   ├── utils.py         # Utility functions
│   └── schedule_generator.py # Core scheduling logic
├── frontend/            # All React frontend code
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .vscode/             # VS Code specific settings (e.g., launch.json)
├── employees.json       # Employee data
├── on_call_rotation.json # On-call data
├── README.md
└── .gitignore
```

## Setup and Installation

### Backend (Python/Flask)

1.  Navigate to the `backend` directory: `cd backend`
2.  Create a virtual environment (recommended): `python -m venv venv`
3.  Activate the virtual environment:
    *   macOS/Linux: `source venv/bin/activate`
    *   Windows: `venv\Scripts\activate`
4.  Install dependencies: `pip install Flask` (add other dependencies if any)

### Frontend (React/TypeScript)

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install` or `yarn install`

## Running the Application

1.  **Start the Backend Server**:
    *   Navigate to `/Users/dvircooper/projects/shavzak/backend/`
    *   Run: `python app.py`
    *   The backend will typically run on `http://127.0.0.1:5000`.

2.  **Build and Watch Frontend (for development with Python server serving static files)**:
    *   Navigate to `/Users/dvircooper/projects/shavzak/frontend/`
    *   Run: `npm run watch:build` (This script watches for file changes and rebuilds the `dist` folder)

3.  **Access the Application**:
    *   Open your web browser and go to `http://127.0.0.1:5000` (or the port your Flask app is running on).

---

*This README is a starting point. Feel free to expand it with more details, deployment instructions, or contribution guidelines as your project evolves!*