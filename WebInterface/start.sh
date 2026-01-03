#!/bin/bash
# Monopoly Web Interface Startup Script

cd "$(dirname "$0")"

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip setuptools wheel
pip install -q 'Flask==2.3.3' 'Werkzeug==2.3.7' 'watchdog>=3.0'

# Start Flask server
echo ""
echo "=========================================="
echo "🚀 Starting Monopoly Web Interface"
echo "=========================================="
echo ""
echo "Server running at: http://127.0.0.1:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

python run.py
