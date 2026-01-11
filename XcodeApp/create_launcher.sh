#!/bin/bash
# Create launcher wrapper script that starts Flask before launching the app

LAUNCHER_PATH="$BUILT_PRODUCTS_DIR/$PRODUCT_NAME.app/Contents/MacOS/launcher.sh"

cat > "$LAUNCHER_PATH" << 'LAUNCHER'
#!/bin/bash

# Get the project directory
PROJECT_DIR="$HOME/Projects/Monopoly app"
WEBINTERFACE_DIR="$PROJECT_DIR/WebInterface"

# Check if Flask is already running
if pgrep -f "python.*run.py" > /dev/null 2>&1; then
    echo "Flask already running"
else
    # Remove old port config file
    rm -f "$WEBINTERFACE_DIR/.flask_port"
    
    # Start Flask in background
    cd "$PROJECT_DIR"
    source .venv/bin/activate 2>/dev/null || true
    cd "$WEBINTERFACE_DIR"
    python run.py > /tmp/flask_monopoly.log 2>&1 &
    
    # Wait for Flask to create port config file
    for i in {1..30}; do
        if [ -f "$WEBINTERFACE_DIR/.flask_port" ]; then
            FLASK_PORT=$(grep -o '"port": [0-9]*' "$WEBINTERFACE_DIR/.flask_port" | grep -o '[0-9]*')
            if [ ! -z "$FLASK_PORT" ]; then
                if curl -s http://127.0.0.1:$FLASK_PORT/ >/dev/null 2>&1; then
                    echo "Flask ready on port $FLASK_PORT"
                    sleep 2
                    break
                fi
            fi
        fi
        sleep 0.5
    done
fi

# Launch the actual app
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec "$DIR/MonopolyApp"
LAUNCHER

chmod +x "$LAUNCHER_PATH"
echo "Created launcher script at: $LAUNCHER_PATH"
