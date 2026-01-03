"""
Entry point for Monopoly Web Interface Flask application
Run with: python run.py
"""

from app import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)
