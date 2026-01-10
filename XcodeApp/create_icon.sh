#!/bin/bash

# Create a simple Monopoly icon using SF Symbols or text-based icon

ICON_DIR="/tmp/monopoly_icon.iconset"
mkdir -p "$ICON_DIR"

# Create different sized icons using sips (built-in macOS tool)
# We'll create a simple colored square as a placeholder

# Generate base PNG (512x512) with ImageMagick or use sf symbols
# For now, let's use a simple approach with built-in tools

cat > /tmp/monopoly_icon.svg << 'SVG'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E7D32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1B5E20;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>
  <text x="256" y="200" font-family="Arial" font-size="120" font-weight="bold" fill="white" text-anchor="middle">M</text>
  <text x="256" y="360" font-family="Arial" font-size="48" fill="#FFD700" text-anchor="middle">MONOPOLY</text>
</svg>
SVG

# Convert SVG to PNG if rsvg-convert is available, otherwise skip icon creation
if command -v rsvg-convert &> /dev/null; then
    # Create all required sizes
    for size in 16 32 64 128 256 512; do
        rsvg-convert -w $size -h $size /tmp/monopoly_icon.svg -o "$ICON_DIR/icon_${size}x${size}.png"
        if [ $size -le 256 ]; then
            rsvg-convert -w $((size*2)) -h $((size*2)) /tmp/monopoly_icon.svg -o "$ICON_DIR/icon_${size}x${size}@2x.png"
        fi
    done
    
    # Convert iconset to icns
    iconutil -c icns "$ICON_DIR" -o /tmp/AppIcon.icns
    
    echo "✓ Icon created: /tmp/AppIcon.icns"
    
    # Copy to app bundles
    cp /tmp/AppIcon.icns /Applications/Monopoly.app/Contents/Resources/
    cp /tmp/AppIcon.icns /Users/rupam/Applications/Monopoly.app/Contents/Resources/
    
    # Update Info.plist to reference icon
    defaults write /Applications/Monopoly.app/Contents/Info CFBundleIconFile AppIcon
    defaults write /Users/rupam/Applications/Monopoly.app/Contents/Info CFBundleIconFile AppIcon
    
    # Refresh icon cache
    touch /Applications/Monopoly.app
    touch /Users/rupam/Applications/Monopoly.app
    killall Dock
    
    echo "✓ Icon installed and Dock refreshed"
else
    echo "⚠ rsvg-convert not found. Install with: brew install librsvg"
    echo "   Skipping icon creation for now."
fi

# Cleanup
rm -rf "$ICON_DIR" /tmp/monopoly_icon.svg

