# Monopoly MacAppSwift - Swift-Only macOS Application

## Overview
This is a **pure Swift** implementation of the Monopoly game management system for macOS. Unlike the MacApp version, this application has **no Python dependencies** and is completely self-contained.

## Architecture

### Pure Swift Implementation
- **DataManager.swift**: Core business logic for managing game data
  - Asset validation and assignment
  - Player ownership tracking
  - Rent payment processing
  - House cap enforcement (max 4 houses per property)

- **ContentView.swift**: SwiftUI user interface
  - Property assignment interface
  - Real-time database viewer
  - Interactive pickers for players, areas, and assets

### Data Files (Bundled with App)
All game data is stored in JSON files bundled within the application:
- `Asset_database.json`: Property definitions and rent structures
- `Player_database.json`: Player ownership state
- `Player_accounts.json`: Financial transaction ledger
- `Commercial_properties.json`: Commercial asset tracking

## Building the Application

### Prerequisites
- macOS with Xcode installed
- No Python or other dependencies required

### Build Instructions

#### Build with Command Line
```bash
./wrapper_build.sh
```

This will:
- Build the Release configuration
- Create a versioned release in `releases/vX.Y.Z/`
- Auto-increment version numbers
- Generate a build info file

### Build & Run (One Command)
```bash
./wrapper_build.sh && open build/DerivedData/Build/Products/Release/Monopoly.app
```

## 📂 Project Structure

```
MacApp/
├── Monopoly/                           # Xcode project directory
│   ├── Monopoly.xcodeproj/            # Xcode project file
│   ├── Monopoly/                      # Source code
│   │   ├── MonopolyApp.swift         # Main app (320 lines)
│   │   ├── ContentView.swift         # SwiftUI placeholder
│   │   └── Assets.xcassets/          # App icons
│   ├── MonopolyTests/                 # Unit tests
│   └── MonopolyUITests/               # UI tests
├── wrapper_build.sh                   # Build wrapper app
└── standalone_build.sh                # Build standalone app
```

## 🏗️ Code Architecture

### MonopolyApp.swift
**Main application class** (322 lines)

**Key Components:**
- `@main class MonopolyApp` - App entry point
- `NSApplicationDelegate` - Manages app lifecycle
- `WKNavigationDelegate` - Handles WebKit events
- `WKScriptMessageHandler` - JavaScript bridge

**Main Functions:**

1. **Application Lifecycle**
   ```swift
   applicationDidFinishLaunching()  // App startup
   applicationWillTerminate()       // Cleanup on quit
   ```

2. **Flask Server Management**
   ```swift
   startFlaskServer()      // Launch Flask if not running
   stopFlaskServer()       // Terminate Flask on exit
   loadFlaskPort()         // Read port from .flask_port file
   getProjectPath()        // Find project directory
   waitForFlask()          // Poll until Flask is ready
   ```

3. **Window Management**
   ```swift
   createPropertyWindow()  // Main property management window
   createAccountsWindow()  // Player accounts window
   ```

4. **Menu Bar**
   ```swift
   setupMenuBar()          // Configure app menu
   // Menu items:
   // - Board Move (⌘B)
   // - Show Accounts (⌘A)  
   // - Quit (⌘Q)
   ```

5. **Navigation**
   ```swift
   navigateToHome()        // Go to property assignment
   navigateToAccounts()    // Go to accounts view
   ```

**Flask Integration Flow:**
1. Check if Flask already running (`pgrep -f 'python.*run.py'`)
2. If not, start Flask from `../WebInterface/run.py`
3. Use virtual environment Python if available: `.venv/bin/python`
4. Fallback to system Python: `/usr/bin/python3`
5. Wait up to 30 seconds for Flask to start
6. Read port from `.flask_port` file
7. Load WebKit view with `http://127.0.0.1:<port>/`

**Window Configuration:**
- Size: 1400x900 (property window), 1200x800 (accounts)
- Title bar: Hidden for cleaner look
- WebKit: JavaScript enabled, file access allowed
- Style: Native macOS with custom close/minimize buttons

### ContentView.swift
**SwiftUI compatibility placeholder** (20 lines)

Simple SwiftUI view kept for Xcode template compatibility. Not used in the actual app since we use AppKit/WebKit directly.

## 🔨 Building the App

You have **two options** for building the app, each with different characteristics:

### 🎯 Option A: Wrapper App (Default - Requires Python)

**Best for:** Development, personal use, quick iterations

**Characteristics:**
- ✅ Small app size (~2 MB)
- ✅ Fast build time (~30 seconds)
- ✅ Easy to update (just edit Python files)
- ⚠️ Requires Python + Flask installed on the system
- ⚠️ Requires full project directory structure
- ❌ Not portable to other computers without setup

#### Build Process - Wrapper App

**Method 1: Build Script (Recommended)**
```bash
cd "/Users/rupam/Projects/Monopoly app/MacApp"
./wrapper_build.sh
```

**What it does:**
- Cleans previous builds
- Compiles Swift code
- Links frameworks (WebKit, Cocoa, AppKit)
- Disables code signing (for development)
- Outputs app to: `build/DerivedData/Build/Products/Release/Monopoly.app`

**Build flags:**
- `CODE_SIGN_IDENTITY="-"` - Skip code signing
- `CODE_SIGNING_REQUIRED=NO` - No signature required
- `CODE_SIGNING_ALLOWED=NO` - Signing disabled

**Method 2: Xcode GUI**
```bash
open Monopoly/Monopoly.xcodeproj
```

Then in Xcode:
- **⌘B** - Build only
- **⌘R** - Build and run
- **⌘⇧K** - Clean build folder

---

### 🚀 Option B: Standalone App (Self-Contained Bundle)

**From Build Directory:**
```bash
open build/DerivedData/Build/Products/Release/Monopoly.app
```

**From Finder:**
1. Navigate to `MacApp/build/DerivedData/Build/Products/Release/`
2. Double-click `Monopoly.app`

**From Xcode:**
- **⌘R** - Run directly from Xcode

**On First Launch (Wrapper App):**
1. App searches for project directory
2. Checks if Flask server already running
3. Starts Flask if needed (logs to `/tmp/flask_monopoly.log`)
4. Uses `.venv/bin/python` or `/usr/bin/python3`
5. Waits for Flask to be ready (max 30 seconds)
6. Opens native window with WebKit view
7. Loads property management interface

**Requirements (Wrapper App):**
- Flask server must be in `../WebInterface/`
- Dependencies installed: `pip install -r requirements.txt`
- Python available at `.venv/bin/python` or `/usr/bin/python3`
- Complete project directory structure

### Running Standalone App (Option B)

**From Build Directory:**
```bash
open build/DerivedData/Build/Products/Release/Monopoly.app
```

**From Anywhere:**
- Just double-click `Monopoly.app` - works from any location!

**On First Launch (Standalone App):**
1. App loads bundled `monopoly_server` from Resources
2. Starts embedded Flask (no Python installation needed)
3. Opens native window with WebKit view
4. Loads property management interface

**Requirements (Standalone App):**
- ✅ Nothing! Everything is bundled
- ✅ Works on any Mac with macOS 15.6+
- ✅ No Python installation needed
- ✅ No project directory needed

**Best for:** Distribution, sharing with others, production deployment

**Characteristics:**
- ✅ Fully portable (works on any Mac)
- ✅ No Python installation required
- ✅ No project directory needed
- ✅ Professional distribution
- ⚠️ Larger size (~50-70 MB compressed)
- ⚠️ Longer build time (~2-3 minutes)
- ⚠️ Updates require full rebuild

#### Build Process - Standalone App

**Prerequisites (One-Time Setup):**
```bash
# Install PyInstaller
cd "/Users/rupam/Projects/Monopoly app/WebInterface"
pip install pyinstaller
```

**Step 1: Update MonopolyApp.swift**

You need to modify the Flask startup code to use the bundled server. Replace the `startFlaskServer()` and `getProjectPath()` functions in `Monopoly/Monopoly/MonopolyApp.swift`:

<details>
<summary>Click to see code changes (expand this)</summary>

```swift
func startFlaskServer() {
    // Check if Flask already running
    let checkTask = Process()
    checkTask.launchPath = "/bin/bash"
    checkTask.arguments = ["-c", "pgrep -f 'monopoly_server'"]
    let pipe = Pipe()
    checkTask.standardOutput = pipe
    checkTask.standardError = Pipe()
    
    do {
        try checkTask.run()
        checkTask.waitUntilExit()
        if checkTask.terminationStatus == 0 {
            print("✓ Flask server already running")
            return
        }
    } catch {
        print("Error checking server status: \(error)")
    }
    
    // Start bundled Flask server
    print("Starting bundled Flask server...")
    
    // Get path to bundled server
    guard let resourcePath = Bundle.main.resourcePath else {
        print("ERROR: Could not find app resources")
        return
    }
    
    let serverPath = resourcePath + "/monopoly_server"
    
    if !FileManager.default.fileExists(atPath: serverPath) {
        print("ERROR: Bundled server not found at: \(serverPath)")
        // Fallback to development mode
        startFlaskServerDevelopment()
        return
    }
    
    flaskProcess = Process()
    flaskProcess?.currentDirectoryPath = resourcePath
    flaskProcess?.launchPath = serverPath
    flaskProcess?.arguments = []
    
    // Redirect output
    let logPath = "/tmp/flask_monopoly.log"
    FileManager.default.createFile(atPath: logPath, contents: nil)
    let logFile = FileHandle(forWritingAtPath: logPath)
    flaskProcess?.standardOutput = logFile
    flaskProcess?.standardError = logFile
    
    do {
        try flaskProcess?.run()
        print("✓ Bundled Flask server started")
        
        // Wait for server to be ready
        Thread.sleep(forTimeInterval: 3.0)
    } catch {
        print("Error starting server: \(error)")
    }
}

func getProjectPath() -> String? {
    // First check if we're running with bundled resources
    if let resourcePath = Bundle.main.resourcePath,
       FileManager.default.fileExists(atPath: resourcePath + "/monopoly_server") {
        return resourcePath
    }
    
    // Fallback to development paths
    let possiblePaths = [
        NSHomeDirectory() + "/Projects/Monopoly app",
        NSHomeDirectory() + "/Documents/Monopoly app",
    ]
    
    for path in possiblePaths {
        if FileManager.default.fileExists(atPath: path + "/WebInterface") {
            return path + "/WebInterface"
        }
    }
    
    return nil
}

// Keep development mode as fallback
func startFlaskServerDevelopment() {
    // Original development code here...
}
```
</details>

**Step 2: Build Standalone Bundle**
```bash
cd "/Users/rupam/Projects/Monopoly app/MacApp"
./standalone_build.sh
```

**What it does:**
1. Builds the macOS wrapper app (~30 seconds)
2. Packages Flask with PyInstaller (~2 minutes)
3. Bundles Python + Flask + dependencies into .app
4. Copies database files into bundle
5. Creates fully self-contained app

**Step 3: Test**
```bash
open build/DerivedData/Build/Products/Release/Monopoly.app
```

**Step 4: Create Distributable Package**
```bash
cd build/DerivedData/Build/Products/Release
zip -r Monopoly-Standalone.zip Monopoly.app
```

**Result:**
- App size: ~120-150 MB uncompressed, ~50-70 MB zipped
- Build time: ~2-3 minutes
- **Fully portable** - works on any Mac without Python!

---

### 🔍 Comparison: Which Build Option to Use?

| Feature | Wrapper App | Standalone App |
|---------|-------------|----------------|
| **Build command** | `./wrapper_build.sh` | `./standalone_build.sh` |
| **Build time** | 30 seconds | 2-3 minutes |
| **App size** | 2 MB | 50-70 MB (zipped) |
| **Requires Python** | ✅ Yes | ❌ No |
| **Requires project dir** | ✅ Yes | ❌ No |
| **Portable** | ❌ No | ✅ Yes |
| **Easy updates** | ✅ Just edit files | ⚠️ Rebuild needed |
| **Distribution** | ❌ Complex | ✅ Just share .zip |
| **Best for** | Development | Production/Sharing |

**Recommendation:**
- **Development:** Use wrapper app (`./wrapper_build.sh`)
- **Sharing with team:** Use standalone app (`./standalone_build.sh`)
- **Personal use:** Either works (wrapper is faster)
 the App

### Installing Wrapper App (Local Use)

**Quick Install:**
```bash
cp -r build/DerivedData/Build/Products/Release/Monopoly.app ~/Applications/
```

**Using Finder:**
1. Build the app: `./wrapper_build.sh`
2. Open Finder to `MacApp/build/DerivedData/Build/Products/Release/`
3. Drag `Monopoly.app` to `/Applications` folder

**Launch:**
```bash
open ~/Applications/Monopoly.app
# Or find "Monopoly" in Launchpad
```

**Remember:** Wrapper app requires:
- Complete project directory at `~/Projects/Monopoly app` or `~/Documents/Monopoly app`
- Python installation with Flask dependencies

### Installing Standalone App (Distribution)

**For Yourself:**
```bash
# After building standalone bundle
cp -r build/DerivedData/Build/Products/Release/Monopoly.app ~/Applications/
```

**For Others (Create Distribution Package):**
```bash
# 1. Build standalone bundle
./standalone_build.sh

# 2. Create distributable zip
cd build/DerivedData/Build/Products/Release
zip -r Monopoly-Standalone.zip Monopoly.app

# 3. Share Monopoly-Standalone.zip
# Recipients just:
#   - Unzip the file
#   - Drag Monopoly.app to Applications
#   - Double-click to run
```

**No additional setup required for recipients!**

### First Launch on macOS (Security)

When running the app for the first time, macOS may show a security warning:

**"Monopoly.app cannot be opened because it is from an unidentified developer"**

**Solution:**
1. Right-click (or Control+click) on `Monopoly.app`
2. Select "Open" from the menu
3. Click "Open" in the security dialog
4. App will run and remember your choice

**Alternative (System Preferences):**
1. System Settings → Privacy & Security
2. Scroll to "Security" section
3. Click "Open Anyway" next to the Monopoly.app warning

**For Code Signing (Optional):**
To avoid this warning, sign the app with an Apple Developer account:
```bash
codesign --force --deep --sign "Developer ID Application: Your Name" Monopoly.app
```
Requires Apple Developer Program membership ($99/year)App checks for Flask server
2. Starts Flask if needed (logs to `/tmp/flask_monopoly.log`)
3. Waits for Flask to be ready (max 30 seconds)
4. Opens native window with WebKit view
5. Loads property management interface

**Flask Requirements:**
- Flask server must be in `../WebInterface/`
- Dependencies installed (see `../WebInterface/requirements.txt`)
- Python available at `.venv/bin/python` or `/usr/bin/python3`

## 📦 Installing

### Quick Install
```bash
cp -r build/DerivedData/Build/Products/Release/Monopoly.app ~/Applications/
```

### Using Finder
1. Build the app: `./build.sh`
2. Open Finder to `MacApp/build/DerivedData/Build/Products/Release/`
3. Drag `Monopoly.app` to `/Applications` folder

### Launch from Applications
```bash
open ~/Applications/Monopoly.app
# Or find "Monopoly" in Launchpad
```

## 🔍 Working in Xcode

### Viewing Source Files

**Can't see Swift files in Xcode navigator?** This is normal!

The project uses **File System Synchronized Groups** (Xcode 15+). Files exist and work perfectly but may be hidden in the navigator.

**Quick Solutions:**

**Option 1: Open Quickly (Recommended)**
- Press **⌘⇧O** (Command+Shift+O)
- Type: `MonopolyApp` or `ContentView`
- Press Enter

**Option 2: Expand Folder**
- Click the **▸ triangle** next to "Monopoly" folder in navigator
- Files appear: `MonopolyApp.swift`, `ContentView.swift`

**Option 3: Clean Build**
- Product → Clean Build Folder (**⌘⇧K**)
- Close and reopen Xcode

**Verify files exist:**
```bash
ls -la Monopoly/Monopoly/
# Output: MonopolyApp.swift, ContentView.swift, Assets.xcassets/
```

### Essential Xcode Shortcuts

| Action | Shortcut |
|--------|----------|
| Open file | **⌘⇧O** |
| Find in project | **⌘⇧F** |
| Build | **⌘B** |
| Run | **⌘R** |
| Clean | **⌘⇧K** |
| Show console | **⌘⇧C** |
| Reveal in navigator | **⌘⇧J** |

## 🐛 Troubleshooting

### Build Fails with Code Signing Error
**Solution:** Use `./wrapper_build.sh` which disables code signing automatically.

### Files Not Visible in Xcode
**Solution:** Press **⌘⇧O** to open files by name (faster than navigator anyway).

### App Won't Launch
**Check:**
1. Flask dependencies installed: `cd ../WebInterface && pip install -r requirements.txt`
2. Flask logs: `tail -f /tmp/flask_monopoly.log`
3. Port file exists: `cat ../WebInterface/.flask_port`

### "Flask Failed to Start"
**Fix:**
```bash
cd ../WebInterface
python run.py  # Test Flask manually
```

If Flask starts successfully, the app will work.

### Window Shows Blank/Loading
**Check:**
1. Flask is running: `pgrep -f 'python.*run.py'`
2. Flask port: `cat ../WebInterface/.flask_port`
3. WebKit console: Open Safari → Develop → Show Web Inspector

### Clean Everything
```bash
# Clean Xcode build
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/Monopoly-*

# Restart Flask
pkill -f 'python.*run.py'
cd ../WebInterface && python run.py
```

## 📋 Dependencies

**System Requirements:**
- macOS 15.6+
- Xcode 26.1+
- Python 3.8+

**Frameworks Used:**
- `Cocoa` - macOS native UI
- `AppKit` - Window management
- `WebKit` - Web view rendering
- `Foundation` - Core utilities

**Python Dependencies:** (See `../WebInterface/requirements.txt`)
- Flask 2.0+
- Other dependencies from web interface

## 🔗 Project Dependencies & Standalone Behavior

### ⚠️ Important: This is NOT a Standalone App

Unlike a Docker container or bundled application, the built `Monopoly.app` **requires the complete project directory structure** to function. It is essentially a native macOS wrapper that launches and manages the Flask web server.

**What the app IS:**
- Native macOS launcher for the Flask web interface
- Window manager with WebKit rendering
- Menu bar integration for navigation
- Process manager for Flask server lifecycle

**What the app is NOT:**
- A standalone executable (like a Docker image)
- Self-contained with embedded Python/Flask
- Portable across computers without setup

### How the App Finds & Runs Python Code

#### 1. Project Path Discovery
When launched, the app searches for the project directory in these locations (in order):

```swift
// From MonopolyApp.swift - getProjectPath()
let possiblePaths = [
    "~/Projects/Monopoly app",
    "~/Documents/Monopoly app",
]
```

It looks for a folder named "Monopoly app" containing the `WebInterface/` subdirectory.

#### 2. Python Interpreter Selection
The app uses Python in this priority order:

```swift
// From MonopolyApp.swift - startFlaskServer()
let venvPython = projectPath + "/.venv/bin/python"
if FileManager.default.fileExists(atPath: venvPython) {
    flaskProcess?.launchPath = venvPython  // Preferred
} else {
    flaskProcess?.launchPath = "/usr/bin/python3"  // Fallback
}
```

**Priority:**
1. **Virtual environment**: `.venv/bin/python` (recommended)
2. **System Python**: `/usr/bin/python3` (requires system installation)

#### 3. Flask Server Launch Process

**Step-by-step execution:**

```
1. App launches → applicationDidFinishLaunching()
2. Check if Flask already running → pgrep -f 'python.*run.py'
3. If not running:
   a. Find project path (~/Projects/Monopoly app)
   b. Change directory to: projectPath/WebInterface
   c. Execute: python run.py
   d. Redirect output to: /tmp/flask_monopoly.log
4. Wait for Flask startup (max 30 seconds):
   a. Poll for .flask_port file
   b. Read port from JSON: {"port": 5001}
   c. Test connection: http://127.0.0.1:5001/
5. Load WebKit view with Flask URL
```

#### 4. File Access Map

The app accesses these files/directories at runtime:

```
~/Projects/Monopoly app/          ← Project root (discovered dynamically)
├── .venv/bin/python              ← Python interpreter (preferred)
├── WebInterface/                 ← Flask application
│   ├── run.py                   ← Entry point (executed by app)
│   ├── requirements.txt         ← Dependencies (must be pre-installed)
│   ├── .flask_port              ← Port config (read by app)
│   ├── app/                     ← Flask routes
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── DatabasePackage/         ← Business logic
│   │   ├── player_manager.py
│   │   └── data_service.py
│   ├── DatabaseJson/            ← Data files (read/write)
│   │   ├── Asset_database.json
│   │   ├── Player_database.json
│   │   ├── Player_accounts.json
│   │   └── Commercial_properties.json
│   ├── templates/               ← HTML files (served by Flask)
│   │   ├── index.html
│   │   └── accounts.html
│   └── static/                  ← CSS/JS (served by Flask)
│       ├── css/style.css
│       └── js/app.js
└── MacApp/                       ← THIS directory
    └── build/.../Monopoly.app   ← Built app (just a launcher)
```

**Key Point:** The .app bundle contains **only the Swift executable** - no Python, Flask, or data files.

### Requirements for the App to Run

#### On the Computer Where You Build
✅ Already set up (you've been running it)

#### On a Different Computer
You need **ALL** of these:

**1. System Requirements:**
- macOS 15.6+
- Python 3.8+ at `/usr/bin/python3` OR a virtual environment

**2. Complete Project Structure:**
```bash
# Must copy ENTIRE project directory
cp -r "/Users/rupam/Projects/Monopoly app" /destination/
```

**3. Python Dependencies:**
```bash
cd "/destination/Monopoly app/WebInterface"
pip install -r requirements.txt
```

**4. Project Location:**
Place in one of these locations:
- `~/Projects/Monopoly app`
- `~/Documents/Monopoly app`

**5. The Built App:**
```bash
cp -r Monopoly.app ~/Applications/
```

### Why It's Not Standalone

**The .app bundle contains:**
- ✅ Swift executable (MonopolyApp binary)
- ✅ App icons and assets
- ✅ Info.plist configuration
- ❌ **NO Python interpreter**
- ❌ **NO Flask framework**
- ❌ **NO Python dependencies**
- ❌ **NO database files**
- ❌ **NO web interface code**

**Comparison:**

| Feature | This App | Docker Container | True Standalone |
|---------|----------|------------------|-----------------|
| Embeds Python | ❌ | ✅ | ✅ |
| Embeds Flask | ❌ | ✅ | ✅ |
| Embeds data files | ❌ | ✅ | ✅ |
| Requires project directory | ✅ Yes | ❌ | ❌ |
| Requires system Python | ✅ Yes* | ❌ | ❌ |
| Portable | ❌ | ✅ | ✅ |

*If no virtual environment

## 📦 Making a Self-Contained App (Standalone Distribution)

### Overview

To distribute the app without requiring users to install Python, Flask, or copy the project directory, you need to **bundle everything into the .app**.

### Recommended Approach: PyInstaller + App Bundle

This creates a truly standalone app similar to Docker - one file that runs anywhere.

#### Step 1: Install PyInstaller

```bash
cd "/Users/rupam/Projects/Monopoly app/WebInterface"
pip install pyinstaller
```

#### Step 2: Create PyInstaller Spec File

Create `WebInterface/monopoly_server.spec`:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
        ('DatabaseJson', 'DatabaseJson'),
        ('DatabasePackage', 'DatabasePackage'),
        ('app', 'app'),
    ],
    hiddenimports=[
        'flask',
        'werkzeug',
        'jinja2',
        'click',
        'itsdangerous',
        'json',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='monopoly_server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
```

#### Step 3: Build Standalone Flask Executable

```bash
cd "/Users/rupam/Projects/Monopoly app/WebInterface"
pyinstaller monopoly_server.spec
```

This creates: `WebInterface/dist/monopoly_server` (standalone executable with Python + Flask + all dependencies)

#### Step 4: Create Bundle Script

Create `MacApp/create_standalone_bundle.sh`:

```bash
#!/bin/bash
set -e

echo "🎯 Creating Standalone Monopoly.app Bundle"
echo ""

# Paths
MACAPP_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$MACAPP_DIR")"
WEB_DIR="$PROJECT_ROOT/WebInterface"
BUILD_DIR="$MACAPP_DIR/build/DerivedData/Build/Products/Release"
APP_BUNDLE="$BUILD_DIR/Monopoly.app"

# Step 1: Build the macOS app normally
echo "Step 1: Building macOS app..."
cd "$MACAPP_DIR"
./build.sh

if [ ! -d "$APP_BUNDLE" ]; then
    echo "❌ App build failed"
    exit 1
fi

# Step 2: Build Flask with PyInstaller
echo ""
echo "Step 2: Building standalone Flask server with PyInstaller..."
cd "$WEB_DIR"

if [ ! -f "monopoly_server.spec" ]; then
    echo "❌ Error: monopoly_server.spec not found"
    echo "Please create the spec file first (see README)"
    exit 1
fi

pyinstaller monopoly_server.spec --clean

if [ ! -f "dist/monopoly_server" ]; then
    echo "❌ PyInstaller build failed"
    exit 1
fi

# Step 3: Bundle Flask into .app
echo ""
echo "Step 3: Bundling Flask server into .app..."

# Create Resources directory if it doesn't exist
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy standalone Flask server
cp "dist/monopoly_server" "$APP_BUNDLE/Contents/Resources/"
chmod +x "$APP_BUNDLE/Contents/Resources/monopoly_server"

# Copy database files (templates/static already bundled by PyInstaller)
cp -r "DatabaseJson" "$APP_BUNDLE/Contents/Resources/"

echo ""
echo "✅ Standalone bundle created successfully!"
echo ""
echo "📦 Bundle contents:"
ls -lh "$APP_BUNDLE/Contents/Resources/"
echo ""
echo "📏 Total app size:"
du -sh "$APP_BUNDLE"
echo ""
echo "🚀 To test:"
echo "   open '$APP_BUNDLE'"
echo ""
echo "📤 To distribute:"
echo "   Zip the app: cd '$BUILD_DIR' && zip -r Monopoly.zip Monopoly.app"
echo "   Share Monopoly.zip - users just unzip and double-click!"
```

#### Step 5: Update MonopolyApp.swift

Modify the Flask startup code to use the bundled server:

```swift
// In startFlaskServer() function, replace the Python path detection with:

func startFlaskServer() {
    // Check if Flask already running
    let checkTask = Process()
    checkTask.launchPath = "/bin/bash"
    checkTask.arguments = ["-c", "pgrep -f 'monopoly_server'"]
    let pipe = Pipe()
    checkTask.standardOutput = pipe
    checkTask.standardError = Pipe()
    
    do {
        try checkTask.run()
        checkTask.waitUntilExit()
        if checkTask.terminationStatus == 0 {
            print("✓ Flask server already running")
            return
        }
    } catch {
        print("Error checking server status: \(error)")
    }
    
    // Start bundled Flask server
    print("Starting bundled Flask server...")
    
    // Get path to bundled server
    guard let resourcePath = Bundle.main.resourcePath else {
        print("ERROR: Could not find app resources")
        return
    }
    
    let serverPath = resourcePath + "/monopoly_server"
    
    if !FileManager.default.fileExists(atPath: serverPath) {
        print("ERROR: Bundled server not found at: \(serverPath)")
        return
    }
    
    flaskProcess = Process()
    flaskProcess?.currentDirectoryPath = resourcePath
    flaskProcess?.launchPath = serverPath
    flaskProcess?.arguments = []
    
    // Redirect output
    let logPath = "/tmp/flask_monopoly.log"
    FileManager.default.createFile(atPath: logPath, contents: nil)
    let logFile = FileHandle(forWritingAtPath: logPath)
    flaskProcess?.standardOutput = logFile
    flaskProcess?.standardError = logFile
    
    do {
        try flaskProcess?.run()
        print("✓ Bundled Flask server started")
        
        // Wait for server to be ready
        waitForFlask()
    } catch {
        print("Error starting server: \(error)")
    }
}

// Update getProjectPath to look in bundle resources:
func getProjectPath() -> String? {
    // First check if we're running with bundled resources
    if let resourcePath = Bundle.main.resourcePath,
       FileManager.default.fileExists(atPath: resourcePath + "/monopoly_server") {
        return resourcePath
    }
    
    // Fallback to development paths
    let possiblePaths = [
        NSHomeDirectory() + "/Projects/Monopoly app",
        NSHomeDirectory() + "/Documents/Monopoly app",
    ]
    
    for path in possiblePaths {
        if FileManager.default.fileExists(atPath: path + "/WebInterface") {
            return path + "/WebInterface"
        }
    }
    
    return nil
}
```

#### Step 6: Build Standalone App

```bash
cd "/Users/rupam/Projects/Monopoly app/MacApp"
chmod +x create_standalone_bundle.sh
./create_standalone_bundle.sh
```

#### Step 7: Test & Distribute

```bash
# Test the standalone app
open build/DerivedData/Build/Products/Release/Monopoly.app

# Create distributable zip
cd build/DerivedData/Build/Products/Release
zip -r Monopoly.zip Monopoly.app

# Share Monopoly.zip
# Users just unzip and run - no Python/Flask installation needed!
```

### What Gets Bundled

**Monopoly.app/Contents/**
```
├── MacOS/
│   └── Monopoly                    # Swift executable (original)
└── Resources/
    ├── monopoly_server             # Standalone Flask (PyInstaller bundle)
    │   ├── Python runtime          # ✅ Embedded Python
    │   ├── Flask + dependencies    # ✅ All pip packages
    │   ├── templates/              # ✅ HTML files
    │   ├── static/                 # ✅ CSS/JS
    │   └── app/                    # ✅ Flask routes
    └── DatabaseJson/               # ✅ Database files
        ├── Asset_database.json
        ├── Player_database.json
        └── ...
```

**Size:** ~80-150 MB (compressed: ~40-60 MB)

### Advantages of Standalone Bundle

✅ **True portability** - Works on any Mac with macOS 15.6+  
✅ **No Python required** - Everything embedded  
✅ **No installation** - Just unzip and run  
✅ **Single download** - One .zip file  
✅ **Offline capable** - No external dependencies  
✅ **Professional** - Like commercial apps  

### Disadvantages

❌ **Large file size** - 40-60 MB compressed vs 2 MB current  
❌ **Longer build time** - PyInstaller takes 1-2 minutes  
❌ **Updates harder** - Must rebuild entire bundle for changes  
❌ **Code signing complex** - Need Apple Developer account for notarization  

### Alternative: Docker Approach

If you prefer Docker-like isolation:

```bash
# 1. Create Dockerfile in WebInterface/
cat > WebInterface/Dockerfile <<EOF
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "run.py"]
EOF

# 2. Build Docker image
cd WebInterface
docker build -t monopoly-server .

# 3. Update MonopolyApp.swift to use Docker:
# Replace startFlaskServer() to run:
# docker run -d -p 5001:5001 monopoly-server

# 4. Users need Docker Desktop installed
```

**Docker Pros:** Better isolation, easier updates  
**Docker Cons:** Requires Docker Desktop, slower startup

### Recommendation

For **personal/development use**: Current design (requires Python)  
For **team distribution**: PyInstaller standalone bundle  
For **commercial distribution**: PyInstaller + code signing + notarization  
For **server deployment**: Docker container

### Quick Comparison

| Method | Size | Requires | Startup | Best For |
|--------|------|----------|---------|----------|
| Current | 2 MB | Python + Project | 2-3s | Development |
| PyInstaller | 60 MB | Nothing | 3-5s | Distribution |
| Docker | 300 MB | Docker Desktop | 10-15s | Servers |
| Framework | 100 MB | Nothing | 2-3s | Professional |

### Testing Portability

To verify what's needed on another Mac:

```bash
# 1. Copy project
scp -r "/Users/rupam/Projects/Monopoly app" othermac:~/Projects/

# 2. On other Mac, install dependencies
ssh othermac
cd "~/Projects/Monopoly app/WebInterface"
pip3 install -r requirements.txt

# 3. Copy app
scp -r Monopoly.app othermac:~/Applications/

# 4. Run app
ssh othermac
open ~/Applications/Monopoly.app
# Should work if all dependencies installed
```

## 🔗 Related Components

- **WebInterface/** - Flask backend and HTML/CSS/JS frontend
- **DatabasePackage/** - Python business logic for asset management  
- **DatabaseJson/** - JSON database files (Assets, Players, Accounts)

## 📄 License

Part of the Monopoly Property Management System.
