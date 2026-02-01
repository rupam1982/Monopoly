# Monopoly iPhone App

iOS version of the Monopoly property management app, converted from the macOS Cocoa app to use SwiftUI.

## Key Changes from macOS Version

### Framework Migration
- **macOS (Cocoa/AppKit)** → **iOS (SwiftUI/UIKit)**
- Removed `NSApplication`, `NSWindow`, `NSMenu` (macOS-specific)
- Added SwiftUI views with `NavigationView` and `WebView`
- Changed from `WKWebView` embedded in NSWindow to `UIViewRepresentable` wrapper

### SDK & Platform
- **SDKROOT**: `macosx` → `iphoneos`
- **Deployment Target**: `MACOSX_DEPLOYMENT_TARGET 15.6` → `IPHONEOS_DEPLOYMENT_TARGET 15.0`
- Removed macOS-only settings:
  - `COMBINE_HIDPI_IMAGES`
  - `ENABLE_HARDENED_RUNTIME`
  - `ENABLE_APP_SANDBOX`

### Server Architecture
**Important**: iOS apps cannot run Python servers directly.

**macOS app**: Embeds and runs Flask server locally via `Process()` API  
**iOS app**: Connects to external Flask server running on:
- Mac computer on same network
- Cloud server  
- Development machine

### Features

#### Web Interface
- Displays Flask web interface via WebKit
- Full-screen web view when connected
- Settings screen to configure server URL

#### Connection Management
- Auto-detects server availability
- Manual retry option
- Server URL configuration (e.g., `http://192.168.1.100:5001`)

#### UI Components
- SwiftUI-based navigation
- Settings gear icon in toolbar
- Connection status indicators
- Error messages for failed connections

## Building

### In Xcode
1. Open `iPhoneApp/Monopoly/Monopoly.xcodeproj`
2. Select iPhone simulator or device
3. Build & Run (⌘R)

### From Command Line
```bash
cd iPhoneApp
xcodebuild \
    -project Monopoly/Monopoly.xcodeproj \
    -scheme Monopoly \
    -configuration Release \
    -destination 'platform=iOS Simulator,name=iPhone 15' \
    build
```

## Running

1. **Start Flask server** on your Mac:
   ```bash
   cd WebInterface
   python run.py
   ```

2. **Note the server's IP address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Launch iOS app** and go to Settings

4. **Enter server URL**: `http://<your-mac-ip>:5001`

5. **Save & Test Connection**

## Architecture

```
MonopolyApp.swift
├── @main struct MonopolyApp: App
└── FlaskServerManager (ObservableObject)
    ├── serverStatus: String
    ├── serverURL: String
    ├── isConnected: Bool
    └── testConnection()

ContentView.swift
├── ContentView (main interface)
│   ├── WebView (when connected)
│   └── ConnectionError (when disconnected)
├── WebView: UIViewRepresentable (WKWebView wrapper)
└── SettingsView (server configuration)
```

## Code Signing

Currently set to **Manual** with signing **disabled** for development builds.  
For App Store distribution, enable automatic signing and provide a team ID.

## Future Enhancements

- [ ] Add Bonjour discovery to auto-find Flask server on local network
- [ ] Support for offline mode/caching
- [ ] Native iOS UI instead of web view
- [ ] iPad split-view support
- [ ] Dark mode theming

## Differences from Mac App

| Feature | macOS App | iOS App |
|---------|-----------|---------|
| Server | Embedded Flask | External required |
| UI Framework | Cocoa (AppKit) | SwiftUI |
| Menu Bar | Yes | No (uses toolbar) |
| Window Management | Multiple windows | Single view stack |
| Code Signing | Disabled | Required for device |
| Distribution | .app bundle | App Store/TestFlight |
