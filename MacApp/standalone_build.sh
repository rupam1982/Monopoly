#!/bin/bash
set -e

echo "🎯 Creating Standalone Monopoly.app Bundle"
echo "=========================================="
echo ""

# Paths
MACAPP_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$MACAPP_DIR")"
WEB_DIR="$PROJECT_ROOT/WebInterface"

# Step 1: Get or build wrapper app
echo "📱 Step 1: Getting wrapper build..."
cd "$MACAPP_DIR"

# Get the latest wrapper build using find with sort by modification time
# Only match valid semantic versions (vX.Y.Z format)
LATEST_WRAPPER=$(find releases -name "Monopoly.app" -type d 2>/dev/null | grep -v standalone | grep -E '/v[0-9]+\.[0-9]+\.[0-9]+/' | xargs ls -td 2>/dev/null | head -n 1)

if [ -z "$LATEST_WRAPPER" ]; then
    echo "⚠️  No wrapper build found. Building wrapper first..."
    ./wrapper_build.sh
    LATEST_WRAPPER=$(find releases -name "Monopoly.app" -type d 2>/dev/null | grep -v standalone | xargs ls -td 2>/dev/null | head -n 1)
fi

if [ -z "$LATEST_WRAPPER" ]; then
    echo "❌ Failed to create wrapper build"
    exit 1
fi

# Convert to absolute path
LATEST_WRAPPER="$MACAPP_DIR/$LATEST_WRAPPER"

# Extract version from wrapper path (e.g., releases/v1.0.0/Monopoly.app -> 1.0.0)
WRAPPER_VERSION=$(echo "$LATEST_WRAPPER" | sed -n 's|.*/v\([0-9.]*\)/.*|\1|p')

if [ -z "$WRAPPER_VERSION" ]; then
    echo "❌ Could not extract version from wrapper path: $LATEST_WRAPPER"
    exit 1
fi

# Create versioned build directory for standalone
BUILD_DIR="$MACAPP_DIR/releases/v$WRAPPER_VERSION-standalone"

# Check if this standalone version already exists
if [ -d "$BUILD_DIR" ]; then
    echo "⚠️  Standalone v$WRAPPER_VERSION already exists. Building new wrapper version..."
    ./wrapper_build.sh
    
    # Get the new wrapper build (latest by modification time)
    # Only match valid semantic versions (vX.Y.Z format)
    LATEST_WRAPPER=$(find releases -name "Monopoly.app" -type d 2>/dev/null | grep -v standalone | grep -E '/v[0-9]+\.[0-9]+\.[0-9]+/' | xargs ls -td 2>/dev/null | head -n 1)
    if [ -z "$LATEST_WRAPPER" ]; then
        echo "❌ Failed to create new wrapper build"
        exit 1
    fi
    
    # Convert to absolute path and extract new version
    LATEST_WRAPPER="$MACAPP_DIR/$LATEST_WRAPPER"
    WRAPPER_VERSION=$(echo "$LATEST_WRAPPER" | sed -n 's|.*/v\([0-9.]*\)/.*|\1|p')
    
    if [ -z "$WRAPPER_VERSION" ]; then
        echo "❌ Could not extract version from new wrapper path: $LATEST_WRAPPER"
        exit 1
    fi
    
    BUILD_DIR="$MACAPP_DIR/releases/v$WRAPPER_VERSION-standalone"
fi

echo "✅ Using wrapper build: $LATEST_WRAPPER"
echo "   Version: v$WRAPPER_VERSION"
echo ""

# Step 2: Check PyInstaller installation
echo "🔍 Step 2: Checking PyInstaller..."
if ! command -v pyinstaller &> /dev/null; then
    echo "⚠️  PyInstaller not found. Installing..."
    cd "$WEB_DIR"
    pip install pyinstaller
fi
echo "✅ PyInstaller ready"
echo ""

# Step 3: Build Flask with PyInstaller
echo "🐍 Step 3: Building standalone Flask server with PyInstaller..."
cd "$WEB_DIR"

if [ ! -f "monopoly_server.spec" ]; then
    echo "❌ Error: monopoly_server.spec not found in WebInterface/"
    echo "Please create the spec file first (see README)"
    exit 1
fi

echo "   Building... (this may take 1-2 minutes)"
pyinstaller monopoly_server.spec --clean --noconfirm

if [ ! -f "dist/monopoly_server" ]; then
    echo "❌ PyInstaller build failed"
    exit 1
fi

echo "✅ Flask server built as standalone executable"
SERVER_SIZE=$(du -h "dist/monopoly_server" | cut -f1)
echo "   Size: $SERVER_SIZE"
echo ""

# Step 4: Bundle Flask into .app
echo "📦 Step 4: Bundling Flask server into .app..."

# Create versioned standalone directory
mkdir -p "$BUILD_DIR"

# Copy wrapper app to standalone build
echo "   Copying wrapper app..."
cp -r "$LATEST_WRAPPER" "$BUILD_DIR/"
APP_BUNDLE="$BUILD_DIR/Monopoly.app"

# Create Resources directory if it doesn't exist
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy standalone Flask server
echo "   Copying monopoly_server..."
cp "dist/monopoly_server" "$APP_BUNDLE/Contents/Resources/"
chmod +x "$APP_BUNDLE/Contents/Resources/monopoly_server"

# Copy database files (templates/static already bundled by PyInstaller)
echo "   Copying DatabaseJson..."
cp -r "DatabaseJson" "$APP_BUNDLE/Contents/Resources/"

echo "✅ Bundling complete"
echo ""

# Step 5: Create build info and show results
BUILD_INFO="$BUILD_DIR/build_info.txt"
echo "Monopoly Standalone App" > "$BUILD_INFO"
echo "Version: v$WRAPPER_VERSION" >> "$BUILD_INFO"
echo "Build Date: $(date '+%Y-%m-%d %H:%M:%S')" >> "$BUILD_INFO"
echo "Build Type: Standalone (fully portable)" >> "$BUILD_INFO"
echo "Bundled Server Size: $SERVER_SIZE" >> "$BUILD_INFO"

APP_SIZE=$(du -sh "$APP_BUNDLE" | cut -f1)

echo "=========================================="
echo "✅ STANDALONE RELEASE v$WRAPPER_VERSION CREATED!"
echo "=========================================="
echo ""
echo "📦 Release location:"
echo "   $BUILD_DIR/Monopoly.app"
echo ""
echo "📋 Build info:"
cat "$BUILD_INFO"
echo "   App Size: $APP_SIZE"
echo ""
echo "🚀 To test:"
echo "   open \"$APP_BUNDLE\""
echo ""
echo "📤 To create distributable:"
echo "   cd \"$(dirname $BUILD_DIR)\""
echo "   zip -r Monopoly-v$WRAPPER_VERSION-Standalone.zip \"$(basename $BUILD_DIR)\""
echo ""
echo "📂 All releases:"
echo "   ls -lh releases/"
echo ""
