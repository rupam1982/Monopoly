# Monopoly Game Property Management System

An electronic Monopoly property management system with both command-line and web-based interfaces for tracking asset definitions and player ownership.

## Project Structure

```
Monopoly app/
├── Asset_database.json           # Asset reference data (generated from Excel)
├── Asset_database.xlsx           # Asset definitions (source of truth)
├── Player_database.json          # Current player ownership state
├── player_asset_assignment.py    # CLI tool for asset assignments
├── monopoly_app.ipynb            # Jupyter notebook for testing
├── DatabasePackage/              # Core Python module
│   ├── __init__.py
│   ├── player_manager.py         # Asset assignment and validation logic
│   └── __pycache__/
├── WebInterface/                 # Flask web application
│   ├── app/                      # Flask routes and logic
│   ├── templates/                # HTML templates
│   ├── static/                   # CSS and JavaScript
│   ├── DatabaseJson/             # Web-specific database files
│   ├── DatabasePackage/          # Web data service layer
│   ├── run.py                    # Flask application entry point
│   └── README.md                 # Web interface documentation
├── MacApp/                       # Native macOS application
│   ├── Monopoly/                 # Xcode project
│   │   ├── Monopoly.xcodeproj/  # Xcode project file
│   │   └── Monopoly/            # Swift source code
│   ├── build.sh                 # Build script
│   ├── create_standalone_bundle.sh  # Standalone app builder
│   └── README.md                # MacOS app documentation
├── .github/
│   ├── copilot-instructions.md   # AI coding guide
│   └── app_structure.md          # Web app specification
└── README.md                      # This file
```

## Quick Start

### Command-Line Interface

Assign a property to a player using the CLI:

```bash
python player_asset_assignment.py --player "Player 1" --area "Street A" --asset "Boardwalk" --houses 4
```

### Web Interface

Launch the browser-based application:

```bash
cd WebInterface
pip install -r requirements.txt
python run.py
```

Then open: `http://127.0.0.1:5001` (or the port shown in terminal)

### macOS Native App

Build and run the native macOS application:

```bash
cd MacApp
./wrapper_build.sh
open build/DerivedData/Build/Products/Release/Monopoly.app
```

See [MacApp/README.md](MacApp/README.md) for detailed build instructions including standalone app creation.

## System Architecture

### Two-Tier Database Model

1. **Asset_database.json** (Reference data)
   - Source of truth for properties and their financial details
   - Structure: `{Area: {Asset: {land_price, house_price, rent: {...}}}}`
   - Generated from Excel: `Asset_database.xlsx`

2. **Player_database.json** (Ownership state)
   - Mutable player ownership tracking
   - Structure: `{Player: {Area: {Asset: {houses: count}}}}`
   - Auto-generated on first assignment

### Core Components

**DatabasePackage/** - Python module for all game logic:
- `assign_asset_to_player()` - Assign/add properties with validation
- `validate_asset_exists()` - Check if property exists
- `excel_to_assets_json()` - Generate asset database from Excel

**player_asset_assignment.py** - CLI entry point with argparse interface

**WebInterface/** - Flask web application:
- REST API for property assignments
- Dynamic dropdown-based user interface
- Real-time database viewer

## Key Business Rules

### Asset Assignment

1. **Exclusive Ownership**: Each property owned by exactly one player
   - Duplicate assignment → ERROR
   - Same player re-assignment → ADD houses

2. **House Cap**: Maximum 4 houses per property
   - Exceeding cap → WARNING + auto-cap
   - Additive: 2 existing + 3 new = 4 total

3. **Asset Validation**: Property must exist in Asset_database
   - Invalid property → ERROR

## Development & Testing

### Generate Asset Database

```python
from DatabasePackage import excel_to_assets_json
excel_to_assets_json("Asset_database.xlsx")  # Creates Asset_database.json
```

### Run Validation Tests

Open `monopoly_app.ipynb` in Jupyter for comprehensive integration tests.

### API Integration

The web interface uses subprocess to call `player_asset_assignment.py`, ensuring:
- Consistent CLI and web behavior
- File I/O and persistence testing
- Real integration testing (not mocked)

## Configuration

### Web Interface Settings

Edit `WebInterface/run.py` to customize:
- Host and port
- Debug mode
- Database file paths

### Database Paths

Set via `player_asset_assignment.py` arguments:
- `--player_db` - Player database file
- `--asset_db` - Asset database file (for validation)

## Documentation

- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI coding guide with architecture and patterns
- **[.github/app_structure.md](.github/app_structure.md)** - Web app UI specification
- **[WebInterface/README.md](WebInterface/README.md)** - Web app detailed documentation

## Error Handling

Output prefixes for clarity:
- `SUCCESS` - Operation completed successfully
- `ERROR` - Operation blocked (validation failed)
- `WARNING` - Operation allowed but boundary exceeded
- `INFO` - State changes and diagnostics

## Technologies

- **Backend**: Python 3.7+, Flask 2.3+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data**: JSON file-based persistence
- **Data Processing**: Pandas (for Excel to JSON conversion)

## Requirements

### Core Project
- Python 3.7+
- pandas (for Excel handling)

### Web Interface
- Flask 2.3+
- Werkzeug 2.3+

Install all dependencies:
```bash
pip install pandas Flask
cd WebInterface && pip install -r requirements.txt
```

## Example Workflow

```bash
# 1. Generate asset database from Excel
python -c "from DatabasePackage import excel_to_assets_json; excel_to_assets_json('Asset_database.xlsx')"

# 2. Assign property via CLI
python player_asset_assignment.py --player "Alice" --area "Streets" --asset "Boardwalk" --houses 2

# 3. Or use the web interface
cd WebInterface
python run.py
# Then open http://127.0.0.1:5000 in your browser
```

## License

Electronic Monopoly Property Management System
