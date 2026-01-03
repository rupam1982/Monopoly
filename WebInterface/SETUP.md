# Setup Instructions - Fixed ✅

## Problem (Resolved)
The app was using the base conda Python environment instead of a dedicated virtual environment, causing watchdog version conflicts.

## Solution Applied
Created a fresh virtual environment in the WebInterface directory with all correct dependencies.

## How to Run the App (3 Options)

### Option 1: Using the Startup Script (Easiest) ⭐
```bash
cd WebInterface
./start.sh
```
The script will:
- Create a virtual environment (if needed)
- Install all dependencies
- Start the server

Then open: **http://127.0.0.1:5000**

---

### Option 2: Manual Setup
```bash
cd WebInterface

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python run.py
```

Then open: **http://127.0.0.1:5000**

---

### Option 3: Using the Base Conda Environment (Not Recommended)
If you want to use your base conda Python:
```bash
conda install -c conda-forge watchdog>=3.0
pip install -r requirements.txt
python run.py
```

---

## Updated requirements.txt
```
Flask==2.3.3
Werkzeug==2.3.7
watchdog>=3.0
```

## What Was Fixed
✅ Created isolated virtual environment (venv/)  
✅ Upgraded watchdog to version 6.0 (compatible with Werkzeug 2.3.7)  
✅ All dependencies now properly installed  
✅ Flask server starts without errors  
✅ HTML page loads correctly  

## Folder Structure
```
WebInterface/
├── venv/                    ← Virtual environment (auto-created)
├── start.sh                 ← Easy startup script
├── run.py                   ← Flask entry point
├── requirements.txt         ← Dependencies
├── app/
│   ├── __init__.py
│   └── routes.py
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

## Next Steps
1. Run the startup script: `./start.sh`
2. Open http://127.0.0.1:5000 in your browser
3. The Monopoly Property Management interface should load ✅

---

## Troubleshooting

**Issue: Script not found or "Permission denied"**
```bash
chmod +x start.sh
./start.sh
```

**Issue: "python: command not found"**
Use `python3` instead:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 run.py
```

**Issue: Page still blank**
1. Check Flask console for errors
2. Open DevTools (Cmd+Option+I)
3. Check Console and Network tabs for errors
4. Restart the server

---

## Status
✅ **READY TO USE** - Run `./start.sh` and open http://127.0.0.1:5000
