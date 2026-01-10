# Monopoly App - Installation Guide

## Quick Install

Run the installer script:
```bash
cd XcodeApp
bash install.sh
```

This will:
- ✅ Build the native macOS app
- ✅ Install to `/Applications/Monopoly.app`
- ✅ Make it available in Launchpad
- ✅ Configure dynamic port detection (no port conflicts!)

## Requirements

1. **Python Virtual Environment**: Ensure Flask environment exists
   ```bash
   cd "/Users/rupam/Projects/Monopoly app"
   python -m venv .venv
   source .venv/bin/activate
   pip install -r WebInterface/requirements.txt
   ```

2. **macOS 10.15+**: Required for Swift/WebKit support

## Launch Methods

### From Launchpad
1. Open Launchpad (F4 or pinch gesture)
2. Search for "Monopoly"
3. Click the app icon

### From Finder
- Navigate to `/Applications/`
- Double-click `Monopoly.app`

### From Terminal
```bash
open /Applications/Monopoly.app
```

## How It Works

### Dynamic Port System
The app automatically finds an available port (no more port 5000 conflicts!):

1. **Flask Startup**: When launched, Flask searches for an available port starting from 5001
2. **Port File**: Flask writes the port number to `WebInterface/.flask_port`
3. **Swift App**: The native app reads this file and connects to the correct port
4. **No Conflicts**: Works even if ports 5000-5010 are occupied by system services

### App Structure
```
/Applications/Monopoly.app/
├── Contents/
│   ├── Info.plist           # App metadata
│   ├── MacOS/
│   │   ├── Monopoly         # Entry point wrapper
│   │   ├── launcher.sh      # Flask starter script
│   │   └── MonopolyApp      # Compiled Swift app
│   └── Resources/           # Icons, assets
```

## Troubleshooting

### App won't start
Check Flask logs:
```bash
tail -f /tmp/flask_monopoly.log
```

### Port conflicts
The app automatically finds available ports. Check which port is in use:
```bash
cat "/Users/rupam/Projects/Monopoly app/WebInterface/.flask_port"
```

### Blank window
1. Ensure virtual environment is set up correctly
2. Check Flask is running: `ps aux | grep "python run.py"`
3. Test Flask directly: `curl http://127.0.0.1:[PORT]/`

### Reinstall
```bash
cd XcodeApp
bash install.sh  # Rebuilds and reinstalls
```

## Uninstall

```bash
rm -rf /Applications/Monopoly.app
rm -rf ~/Applications/Monopoly.app
killall Dock  # Refresh Launchpad
```

## Features

- 🎯 **Native macOS App**: Proper .app bundle with menu bar
- 🔌 **Auto Port Detection**: No manual configuration needed
- 📊 **Two Views**: 
  - Board Move (property assignment)
  - Accounts (transaction viewer)
- ⌨️ **Keyboard Shortcuts**:
  - `⌘B` - Board Move view
  - `⌘A` - Show Accounts
  - `⌘Q` - Quit
- 🔄 **Auto Flask Startup**: Launches Flask server automatically

## Development

To make changes:
1. Edit `launch.sh` (contains Swift code and startup logic)
2. Run `bash install.sh` to rebuild
3. Test with `open /Applications/Monopoly.app`
