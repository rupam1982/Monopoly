#!/bin/bash

# Monopoly App Installer
# Creates a proper .app bundle and installs to Applications

APP_NAME="MonopolyApp"
BUNDLE_NAME="Monopoly.app"
BUILD_DIR="/tmp/${APP_NAME}_build"
APP_BUNDLE="${BUILD_DIR}/${BUNDLE_NAME}"
INSTALL_DIR="$HOME/Applications"

echo "📦 Building Monopoly.app bundle..."

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Compile the Swift app
echo "Compiling Swift application..."
cd "$(dirname "$0")"

# Extract Swift code from launch.sh
sed -n '/^cat > \/tmp\/monopoly_macos_app.swift << '\''SWIFTCODE'\''$/,/^SWIFTCODE$/p' launch.sh | sed '1d;$d' > /tmp/monopoly_macos_app.swift

swiftc /tmp/monopoly_macos_app.swift -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

if [ $? -ne 0 ]; then
    echo "✗ Compilation failed"
    exit 1
fi

echo "✓ Compiled successfully"

# Create Info.plist
echo "Creating Info.plist..."
cat > "$APP_BUNDLE/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>MonopolyApp</string>
    <key>CFBundleIdentifier</key>
    <string>com.monopoly.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Monopoly</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
PLIST

echo "✓ Info.plist created"

# Create launch wrapper script that starts Flask first
echo "Creating launcher script..."
cat > "$APP_BUNDLE/Contents/MacOS/launcher.sh" << 'LAUNCHER'
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
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/MonopolyApp"
LAUNCHER

chmod +x "$APP_BUNDLE/Contents/MacOS/launcher.sh"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

echo "✓ Launcher created"

# Create a wrapper executable that calls the launcher
cat > "$APP_BUNDLE/Contents/MacOS/Monopoly" << 'WRAPPER'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/launcher.sh"
WRAPPER

chmod +x "$APP_BUNDLE/Contents/MacOS/Monopoly"

# Update Info.plist to use the wrapper
sed -i '' 's/<string>MonopolyApp<\/string>/<string>Monopoly<\/string>/g' "$APP_BUNDLE/Contents/Info.plist"

# Install to Applications
echo "Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
rm -rf "$INSTALL_DIR/$BUNDLE_NAME"
cp -R "$APP_BUNDLE" "$INSTALL_DIR/"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📍 Location: $INSTALL_DIR/$BUNDLE_NAME"
echo ""
echo "To launch:"
echo "  • Find 'Monopoly' in Launchpad"
echo "  • Or double-click $INSTALL_DIR/$BUNDLE_NAME"
echo ""
echo "Note: Make sure Flask virtual environment is set up at:"
echo "  $HOME/Projects/Monopoly app/.venv"
echo ""
