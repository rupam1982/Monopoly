# Monopoly Game Database System - AI Coding Guide

## Project Overview
Electronic Monopoly property management system with a dual-tier database architecture for tracking asset definitions and player ownership.

## Architecture

### Core Components
- **DatabasePackage/**: Python package handling all game logic
  - `player_manager.py`: Asset assignment, validation, and database persistence
- **monopoly_app.ipynb**: Interactive Jupyter notebook for testing and system validation
- **player_asset_assignment.py**: Command-line interface for asset operations

### Data Model
Two separate JSON databases define the system:

1. **Asset_database.json** (Reference data from Excel)
   - Structure: `{Area: {Asset: {land_price, house_price, rent: {no_houses, one_house, ...}}}}`
   - Generated from Asset_database.xlsx via `excel_to_assets_json()`
   - Source of truth for valid assets and their financial properties

2. **Player_database.json** (Mutable ownership state)
   - Structure: `{Player: {Area: {Asset: {houses: count}}}}`
   - Tracks which player owns which asset and house count
   - Auto-generated on first assignment

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

### Assign asset to player
```bash
python player_asset_assignment.py --player "Player 1" --area "Street A" --asset "Boardwalk" --houses 4
```

### Generate asset database from Excel
```python
from DatabasePackage import excel_to_assets_json
excel_to_assets_json("Asset_database.xlsx")  # Creates Asset_database.json
```

### Validate before assignment
```python
from DatabasePackage import validate_asset_exists
exists = validate_asset_exists("Asset_database.json", "Area Name", "Asset Name")
```

## Implementation Notes

- **Database I/O**: Always use `encoding='utf-8'` for JSON file operations
- **JSON structure**: Use `indent=2` for human-readable output
- **Error handling**: Printing error messages is the convention; exceptions are raised only for critical failures (invalid input types)
- **State mutation**: `assign_asset_to_player()` always saves to disk immediately; no separate commit step
- **Validation**: Asset validation is optional (asset_database_file parameter); warnings printed but operations proceed if asset DB unavailable
