# Web App Quick Start Guide

## What Was Built

A complete **Flask-based web application** for the Monopoly Property Management System with:

✅ **Backend API** - Flask with 6 REST endpoints  
✅ **Frontend UI** - Modern, responsive HTML/CSS/JavaScript interface  
✅ **Dynamic Dropdowns** - Areas and properties load from asset database  
✅ **Real-time Database Viewer** - See all assignments in JSON format  
✅ **Business Rules Enforcement** - All validation rules built in  
✅ **CLI Integration** - Uses existing Python backend via subprocess  

## Directory Structure

```
WebInterface/
├── app/
│   ├── __init__.py         ← Flask app factory (creates the app)
│   └── routes.py           ← API endpoints (6 endpoints)
├── templates/
│   └── index.html          ← Main HTML interface
├── static/
│   ├── css/
│   │   └── style.css       ← Responsive styling
│   └── js/
│       └── app.js          ← Frontend logic (dropdown logic, API calls)
├── run.py                  ← Start the server here
├── requirements.txt        ← Dependencies
└── README.md              ← Detailed documentation
```

## Installation & Running (3 Steps)

### Step 1: Install Dependencies
```bash
cd WebInterface
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python run.py
```

You'll see:
```
 * Running on http://127.0.0.1:5000
```

### Step 3: Open in Browser
```
http://127.0.0.1:5000
```

## Key Features

### 1. Player Dropdown
- Lists all existing players from Player_database.json
- **"+ Add New Player"** option to enter a new name
- Shows player name input field when "Add New Player" selected

### 2. Area (Street) Dropdown
- Populated from Asset_database.json
- **Disabled until** a player is selected
- Shows all available property areas

### 3. Property Dropdown
- Populated based on **selected area**
- **Disabled until** an area is selected
- Shows only properties in that area

### 4. Houses Dropdown
- Fixed options: 0, 1, 2, 3, 4 houses
- **Disabled until** a property is selected

### 5. Assign Button
- **Disabled** until all fields are valid
- Calls `player_asset_assignment.py` with CLI arguments
- Shows SUCCESS/ERROR/WARNING messages
- Auto-refreshes data after assignment

### 6. Database Viewer
- Real-time JSON display of Player_database.json
- Shows all current assignments
- "Refresh Database" button for manual updates

## How It Works (Behind the Scenes)

```
User fills form → JavaScript validates → POST to /api/assign
                                           ↓
                                    Flask backend
                                           ↓
                                   subprocess.run()
                                           ↓
                        player_asset_assignment.py
                                           ↓
                                    Updates JSON file
                                           ↓
                                   Returns to browser
                                           ↓
                            Display result message
```

## API Endpoints (6 Total)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/areas` | Get all property areas |
| GET | `/api/assets/<area>` | Get properties in an area |
| GET | `/api/players` | Get all existing players |
| POST | `/api/assign` | Assign property to player |
| GET | `/api/player-assets/<player>` | Get player's properties |
| GET | `/api/database` | Get full database state |

## Business Rules Enforced

✅ **Exclusive ownership** - Each property only one player  
✅ **House cap** - Max 4 houses auto-enforced  
✅ **Additive assignment** - Same player + same property = add houses  
✅ **Asset validation** - Only valid properties accepted  

## Example Usage

1. Open `http://127.0.0.1:5000`
2. Player: Select "Player 1" or "+ Add New Player"
3. Area: Select an area (e.g., "Streets")
4. Property: Select a property (e.g., "Boardwalk")
5. Houses: Select "3"
6. Click "Assign Property"
7. See success message and updated database

## Troubleshooting

### "Asset database not found"
- Ensure Asset_database.json exists in parent directory
- Generate it: `python -c "from DatabasePackage import excel_to_assets_json; excel_to_assets_json('Asset_database.xlsx')"`

### Port 5000 already in use
- Edit `WebInterface/run.py`, change port to 5001:
  ```python
  app.run(debug=True, host='127.0.0.1', port=5001)
  ```

### Dropdown shows no options
- Verify Asset_database.json is valid JSON
- Check it's in the parent (Monopoly app) directory, not WebInterface

## File Highlights

### routes.py
- 6 endpoints with detailed docstrings
- Loads Asset/Player databases
- Calls subprocess for assignments
- Error handling with JSON responses

### app.js
- Dynamic dropdown population
- Real-time button enable/disable logic
- Async API calls with fetch
- Message display handling
- Database refresh on updates

### style.css
- Modern gradient header
- Responsive grid layout
- Color-coded messages (success/error/warning)
- Smooth transitions and hover effects
- Mobile-friendly design

## Next Steps

1. **Test with sample data**: Add a few property assignments via the web UI
2. **Check Player_database.json**: Verify assignments are persisted
3. **Try the database viewer**: See the JSON structure update in real-time
4. **Test validation**: Try assigning same property to two players (should error)

## Documentation Files

- **README.md** (this directory) - Full Web Interface docs
- **../README.md** - Root project overview
- **../.github/copilot-instructions.md** - AI developer guide
- **../.github/app_structure.md** - Original web app spec

---

**The web app is complete and ready to use!** 🎉

All specifications from `app_structure.md` have been implemented:
- ✅ Dropdown dropdowns for players, areas, assets, houses
- ✅ Auto-populated from Asset_database.json
- ✅ Form validation with button enable/disable
- ✅ CLI integration via subprocess
- ✅ Error/success messaging
- ✅ Database state viewer
