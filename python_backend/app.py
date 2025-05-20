import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Import routes
from python_backend.routes.uploads import uploads_bp

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    # Create the Flask app
    app = Flask(__name__)
    
    # Allow CORS for all routes
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(uploads_bp)
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Music Genre Transformation API',
            'version': '1.0.0'
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Server error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Get port from environment, default to 8080
    port = int(os.environ.get('PORT', 8080))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)