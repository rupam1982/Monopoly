# Monopoly Game Database System - AI Coding Guide

## Project Overview
Electronic Monopoly property management system with a multi-tier database architecture for tracking asset definitions, player ownership, and financial transactions. Includes both CLI and web-based interfaces.

## Architecture

### Core Components

#### Root Level (CLI System)
- **DatabasePackage/**: Python package handling all game logic
  - `player_manager.py`: Asset assignment, validation, and database persistence
- **monopoly_app.ipynb**: Interactive Jupyter notebook for testing and system validation
- **player_asset_assignment.py**: Command-line interface for asset operations
- **Asset_database.json**: Root asset reference database
- **Player_database.json**: Root player ownership database

#### Web Interface (WebInterface/)
- **Flask-based web application** for browser-based game management
- **app/**: Flask application module
  - `__init__.py`: Flask app factory
  - `routes.py`: API endpoints and route handlers
- **DatabasePackage/**: Web-specific data service layer
  - `player_manager.py`: Asset assignment functions
  - `data_service.py`: Data access layer for web interface
- **DatabaseJson/**: Web-specific database files
  - `Asset_database.json`: Asset reference (synced with root)
  - `Player_database.json`: Player ownership state
  - `Player_accounts.json`: Financial transaction ledger
  - `Commercial_properties.json`: Commercial asset tracking
- **templates/**: HTML interfaces
  - `index.html`: Property assignment interface
  - `accounts.html`: Player accounts and transaction viewer
- **static/**: Frontend assets
  - `css/style.css`: Application styling
  - `js/app.js`: Property assignment logic
  - `js/accounts.js`: Account viewer logic
- **run.py**: Application entry point

### Data Model

The system uses **four separate JSON databases**:

1. **Asset_database.json** (Reference data from Excel)
   - Structure: `{Area: {Asset: {land_price, house_price, rent: {no_houses, one_house, ...}}}}`
   - Generated from Asset_database.xlsx via `excel_to_assets_json()`
   - Source of truth for valid assets and their financial properties
   - Exists in both root and WebInterface/DatabaseJson/

2. **Player_database.json** (Mutable ownership state)
   - Structure: `{Player: {Area: {Asset: {houses: count}}}}`
   - Tracks which player owns which asset and house count
   - Auto-generated on first assignment
   - Separate instances in root and WebInterface/DatabaseJson/

3. **Player_accounts.json** (Financial transaction ledger - Web only)
   - Structure: `{Player: [{payment amount: amount, payment source: source}, ...]}`
   - Tracks all financial transactions per player
   - Supports rent payments, game start bonuses, etc.
   - Located in WebInterface/DatabaseJson/

4. **Commercial_properties.json** (Commercial asset tracking - Web only)
   - Structure: `{Asset_type: {Asset_name: {player: owner, ...}}}`
   - Tracks ownership of commercial properties (utilities, railroads, etc.)
   - Located in WebInterface/DatabaseJson/

## Critical Business Rules

### Asset Assignment Constraints
1. **Exclusive ownership**: Each asset can only be owned by ONE player
   - If trying to assign an asset already owned by another player → ERROR (assignment denied)
   - If same player gets same asset again → ADD houses to existing count
2. **House cap**: Maximum 4 houses per asset
   - On assignment exceeding cap → WARNING + auto-cap at 4
   - Additive assignment respects cap (e.g., 2 existing + 3 new = 4 total)
3. **Asset validation**: Asset must exist in Asset_database under the specified area
   - Non-existent asset → ERROR (assignment denied)

## Key Developer Patterns

### Function Signature Pattern
All database functions use **keyword-only arguments for player/area/asset/houses**:
```python
assign_asset_to_player(
    player_database_file="Player_database.json",  # positional
    *,  # Forces keyword-only arguments below
    player_name=str,
    area_name=str,
    asset_name=str,
    houses=int,
    asset_database_file=None
)
```
- Prevents argument order confusion (critical with 4+ string parameters)
- Explicit and self-documenting at call sites

### Error/Status Message Format
Console output uses prefixes for clarity:
- `SUCCESS`: Asset successfully assigned
- `ERROR`: Operation blocked (duplicate, invalid asset, etc.)
- `WARNING`: Operation allowed but boundary exceeded (house cap)
- `INFO`: State changes (database loaded/saved)

### Excel to JSON Pipeline
`excel_to_assets_json(excel_file, json_file=None)`:
- Reads first sheet only
- Expects columns: Area, Asset, Land price, House price, Rent: 0-4
- Strips whitespace, handles missing/malformed data gracefully
- Auto-generates JSON filename if not provided (e.g., Asset_database.xlsx → Asset_database.json)

## Testing Approach

### Notebook Testing Strategy (monopoly_app.ipynb)
The notebook uses **subprocess calls** to the CLI script for integration testing:
```python
subprocess.run([
    "python", "player_asset_assignment.py",
    "--player", "Player 1",
    "--area", area1,
    "--asset", asset1_list[0],
    "--houses", "4",
    "--player_db", test_db_file,
    "--asset_db", asset_db_file
])
```

This approach:
- Tests the actual CLI interface (not just internal functions)
- Validates file I/O and persistence
- Enables scenario-based testing with cleanup (remove old test_db_file before each run)

### Test Coverage
Key scenarios: duplicate prevention → house capping → accumulation → invalid assets → data integrity verification

## Common Operations

### CLI Operations

#### Assign asset to player
```bash
python player_asset_assignment.py --player "Player 1" --area "Street A" --asset "Boardwalk" --houses 4
```

#### Generate asset database from Excel
```python
from DatabasePackage import excel_to_assets_json
excel_to_assets_json("Asset_database.xlsx")  # Creates Asset_database.json
```

#### Validate before assignment
```python
from DatabasePackage import validate_asset_exists
exists = validate_asset_exists("Asset_database.json", "Area Name", "Asset Name")
```

### Web Interface Operations

#### Start the web server
```bash
cd WebInterface
python run.py
# Access at http://127.0.0.1:5000
```

#### Key Web Features
- **Property Assignment** (index.html):
  - Dynamic dropdowns for players, areas, and properties
  - Real-time validation and button state management
  - Live database viewer showing current state
  - Support for adding new players on-the-fly

- **Accounts & Transactions** (accounts.html):
  - View all player property inventory
  - Track financial transactions per player
  - Tabbed interface for assets vs. transactions
  - Real-time refresh capability

#### Web API Endpoints
- `GET /api/areas` - Get all available property areas
- `GET /api/assets/<area>` - Get assets in specific area
- `GET /api/players` - Get all existing players
- `GET /api/commercial-asset-types` - Get commercial property types
- `GET /api/commercial-assets/<type>` - Get commercial properties by type
- `POST /api/assign` - Assign property to player
- `GET /api/player-assets/<player>` - Get specific player's assets
- `GET /api/database` - Get full database state
- `POST /api/start-game` - Initialize game with starting balances
- `POST /api/pay-rent` - Process rent payment between players
- `POST /api/buy-utility` - Assign commercial property

## Implementation Notes

### General
- **Database I/O**: Always use `encoding='utf-8'` for JSON file operations
- **JSON structure**: Use `indent=2` for human-readable output
- **Error handling**: Printing error messages is the convention; exceptions are raised only for critical failures (invalid input types)
- **State mutation**: `assign_asset_to_player()` always saves to disk immediately; no separate commit step
- **Validation**: Asset validation is optional (asset_database_file parameter); warnings printed but operations proceed if asset DB unavailable

### Web-Specific
- **Database Path Management**: WebInterface uses its own DatabaseJson/ folder
  - Paths configured via constants in `data_service.py` and `routes.py`
  - Never hardcode paths; use `os.path.join()` with `WEBINTERFACE_ROOT`
- **API Response Format**: 
  - Success: `{'success': True, 'message': '...'}` or data object
  - Error: `{'error': 'message'}` with appropriate HTTP status code
  - Status messages use same prefixes as CLI: SUCCESS, ERROR, WARNING, INFO
- **Frontend State Management**: 
  - All dropdowns interdependent (player → area → property → houses)
  - Use `disabled` attribute for progressive disclosure
  - Auto-refresh database viewer after mutations
- **Separation of Concerns**:
  - `data_service.py`: Pure data access, returns tuples `(data, error)`
  - `routes.py`: HTTP handling, calls data_service and player_manager
  - Frontend JavaScript: UI state, API calls, DOM manipulation

### Flask Architecture
- **App Factory Pattern**: App created in `app/__init__.py`, run from `run.py`
- **Blueprints**: `main` (templates) and `api` (JSON endpoints) separated
- **Static Files**: CSS/JS served from `static/`, templates from `templates/`
- **Development Mode**: Debug mode enabled in `run.py` for auto-reload
