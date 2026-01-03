"""
Flask application factory for Monopoly Web Interface
"""

from flask import Flask
from .routes import api, main


def create_app(config=None):
    """Create and configure Flask application"""
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Configuration
    app.config['JSON_SORT_KEYS'] = False
    
    # Register blueprints
    app.register_blueprint(api)
    app.register_blueprint(main)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
