"""
Entry point for Monopoly Web Interface Flask application
Run with: python run.py
"""

import socket
import os
import json
from app import create_app

def find_available_port(start_port=5001, max_attempts=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            # Try to bind to the port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError:
            continue
    # Fallback to a random high port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port

if __name__ == '__main__':
    # Find available port
    port = find_available_port()
    
    # Save port to config file for the Swift app to read
    config_file = os.path.join(os.path.dirname(__file__), '.flask_port')
    with open(config_file, 'w') as f:
        json.dump({'port': port}, f)
    # Ensure file is written to disk immediately
    os.sync() if hasattr(os, 'sync') else None
    
    print(f"Starting Flask on port {port}", flush=True)
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=port, use_reloader=False)
