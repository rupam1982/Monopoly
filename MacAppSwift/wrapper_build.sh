#!/bin/bash

# Build script for Monopoly macOS app
# This script builds the app using xcodebuild command-line tools

set -e  # Exit on error

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
XCODE_PROJECT="$PROJECT_DIR/Monopoly/Monopoly.xcodeproj"
APP_NAME="Monopoly.app"

# Version management: manually set version or auto-increment
# To change version, set VERSION environment variable: VERSION=1.2.0 ./wrapper_build.sh
if [ -n "$VERSION" ]; then
    NEW_VERSION="$VERSION"
else
    # Auto-increment from latest wrapper release (non-standalone)
    # Only match valid semantic versions (vX.Y.Z format)
    LATEST_VERSION=$(find "$PROJECT_DIR/releases" -type d -name "v*" 2>/dev/null | grep -v standalone | grep -E '/v[0-9]+\.[0-9]+\.[0-9]+$' | sed 's|.*/v||' | sort -V | tail -n 1)
    
    if [ -n "$LATEST_VERSION" ]; then
        # Increment patch version (e.g., 1.0.0 -> 1.0.1)
        IFS='.' read -r major minor patch <<< "$LATEST_VERSION"
        NEW_VERSION="$major.$minor.$((patch + 1))"
    else
        # No releases found, start at 1.0.0
        NEW_VERSION="1.0.0"
    fi
fi

# Create versioned build directory
BUILD_DIR="$PROJECT_DIR/releases/v$NEW_VERSION"
TEMP_BUILD_DIR="$PROJECT_DIR/build"

echo "🔨 Building Monopoly macOS App (Wrapper)"
echo "=========================================="
echo "Version: v$NEW_VERSION"
echo "Project: $XCODE_PROJECT"
echo ""

# Clean temp build directory
echo "Cleaning temporary build directory..."
rm -rf "$TEMP_BUILD_DIR"

# Build the project
echo "Building project..."
xcodebuild \
    -project "$XCODE_PROJECT" \
    -scheme Monopoly \
    -configuration Release \
    -derivedDataPath "$TEMP_BUILD_DIR/DerivedData" \
    -destination 'platform=macOS' \
    CODE_SIGN_IDENTITY="-" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    
    # Find the built app
    TEMP_APP=$(find "$TEMP_BUILD_DIR/DerivedData" -name "$APP_NAME" -type d | head -n 1)
    
    if [ -n "$TEMP_APP" ]; then
        # Create versioned release directory
        mkdir -p "$BUILD_DIR"
        
        # Copy app to versioned release
        echo "📦 Creating release v$NEW_VERSION..."
        cp -r "$TEMP_APP" "$BUILD_DIR/"
        
        # Create build info file
        BUILD_INFO="$BUILD_DIR/build_info.txt"
        echo "Monopoly Wrapper App" > "$BUILD_INFO"
        echo "Version: v$NEW_VERSION" >> "$BUILD_INFO"
        echo "Build Date: $(date '+%Y-%m-%d %H:%M:%S')" >> "$BUILD_INFO"
        echo "Build Type: Wrapper (requires Python)" >> "$BUILD_INFO"
        
        echo ""
        echo "=========================================="
        echo "✅ RELEASE v$NEW_VERSION CREATED"
        echo "=========================================="
        echo ""
        echo "📦 Release location:"
        echo "   $BUILD_DIR/$APP_NAME"
        echo ""
        echo "📋 Build info:"
        cat "$BUILD_INFO"
        echo ""
        echo "🚀 To run this version:"
        echo "   open \"$BUILD_DIR/$APP_NAME\""
        echo ""
        echo "📂 All releases:"
        echo "   ls -lh releases/"
        echo ""
        
        # Clean up temp build
        rm -rf "$TEMP_BUILD_DIR"
    else
        echo "⚠️  Could not find built app in build directory"
        echo "Check: $TEMP_BUILD_DIR/DerivedData"
        exit 1
    fi
else
    echo ""
    echo "❌ Build failed"
    exit 1
fi
