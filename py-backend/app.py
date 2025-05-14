from flask import Flask # Removed unused imports request, jsonify, render_template, defaultdict
from utils import initialize_databases # Only initialize_databases is needed here now
from routes.employee_routes import employee_bp # Import from the routes package
from routes.schedule_routes import schedule_bp # Import from the routes package
from routes.main_routes import main_bp # Import the new main blueprint

app = Flask(__name__,
            template_folder="../frontend/dist",  # Point to the dist folder for templates
            static_folder="../frontend/dist",    # Point to the dist folder for static files
            static_url_path=''                # Serve static files from the root (e.g., /assets/main.js)
            )

# Initialize DB files if they don't exist
initialize_databases()

# Register Blueprints
app.register_blueprint(employee_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(main_bp)

if __name__ == '__main__':
    # Ensure Flask runs on 0.0.0.0 to be accessible on the local network if needed,
    # otherwise 127.0.0.1 is fine for purely local access.
    # debug=True is for development, turn off for any "production" use.
    app.run(host='127.0.0.1', port=5000, debug=True)
