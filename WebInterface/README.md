# Monopoly Web Interface

A Flask-based web application for managing Monopoly game properties and player assets.

## Overview

The Web Interface provides a user-friendly browser-based application for assigning properties to players and tracking ownership in an electronic Monopoly game. It integrates with the core Python backend (`DatabasePackage`) to manage asset assignments and player databases.

## Architecture

```
WebInterface/
├── app/
│   ├── __init__.py          # Flask app factory
│   └── routes.py            # API endpoints and routes
├── templates/
│   └── index.html           # Main HTML interface
├── static/
│   ├── css/
│   │   └── style.css        # Styling
│   └── js/
│       └── app.js           # Frontend logic
├── run.py                   # Application entry point
└── requirements.txt         # Python dependencies
```

## Prerequisites

- Python 3.7 or higher
- Flask 2.0 or higher
- Local dependencies:
  - `Asset_database.json` (asset reference database)
  - `Player_database.json` (player ownership database, auto-created)
  - `DatabasePackage/` (Python module with data access functions)

## Installation

1. **Navigate to the WebInterface directory:**
   ```bash
   cd WebInterface
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. **Start the Flask development server:**
   ```bash
   python run.py
   ```

   The application will be available at: `http://127.0.0.1:5000`

2. **Access the web interface:**
   - Open your browser and navigate to `http://127.0.0.1:5000`
   - You'll see the Monopoly Property Management interface

## Usage

### Assigning Properties to Players

1. **Select Player:**
   - Choose an existing player from the "Player" dropdown
   - Or select "+ Add New Player" to enter a new player name

2. **Select Area:**
   - Choose the property area (street) from the "Area (Street)" dropdown
   - The dropdown is enabled once a player is selected

3. **Select Property:**
   - Choose the specific property from the "Property" dropdown
   - The dropdown is populated based on the selected area

4. **Select Number of Houses:**
   - Choose the number of houses (0-4) from the "Houses" dropdown

5. **Assign Property:**
   - Click the "Assign Property" button to assign the property
   - The button is only enabled when all fields are valid

6. **View Results:**
   - Success/Error/Warning messages are displayed below the form
   - The "Current Database State" section updates automatically

### Database Viewer

- View all currently assigned properties in JSON format
- Click "Refresh Database" to update the view
- Shows the complete player ownership structure

## API Endpoints

### GET /api/areas
Returns all available property areas.

```json
{
  "areas": ["Area 1", "Area 2", ...]
}
```

### GET /api/assets/<area>
Returns all properties in a specific area.

```json
{
  "assets": ["Property 1", "Property 2", ...]
}
```

### GET /api/players
Returns all existing players.

```json
{
  "players": ["Player 1", "Player 2", ...]
}
```

### POST /api/assign
Assigns a property to a player.

**Request:**
```json
{
  "player_name": "Player 1",
  "area_name": "Area 1",
  "asset_name": "Property 1",
  "houses": 2
}
```

**Response:**
```json
{
  "status": "success|warning|error",
  "message": "Assignment result message",
  "return_code": 0
}
```

### GET /api/database
Returns the complete player and asset databases.

```json
{
  "asset_database": {...},
  "player_database": {...}
}
```

## Features

- **Dynamic Dropdowns:** Property and area lists are populated from the asset database
- **Real-time Validation:** The assign button is only enabled when all fields are valid
- **Responsive Design:** Works on desktop and mobile browsers
- **Live Database Viewer:** See real-time updates to the player ownership database
- **Error Handling:** Clear error, warning, and success messages
- **New Player Support:** Ability to add new players on the fly

## Business Rules Enforced

1. **Exclusive Ownership:** Each property can only be owned by one player
2. **House Limit:** Maximum 4 houses per property
3. **Additive Assignment:** Assigning to an existing property adds houses
4. **Asset Validation:** Only valid properties from the asset database are accepted

## Development

### Adding Custom Styling

Edit [static/css/style.css](static/css/style.css) to customize the appearance.

### Modifying API Behavior

Edit [app/routes.py](app/routes.py) to change API endpoints or add new functionality.

### Updating the Frontend

Edit [templates/index.html](templates/index.html) to modify the HTML structure or [static/js/app.js](static/js/app.js) for frontend logic.

## Troubleshooting

### Asset Database Not Found

**Issue:** "Asset database not found" error message

**Solution:** Ensure `Asset_database.json` exists in the parent project directory. Generate it from `Asset_database.xlsx`:
```python
from DatabasePackage import excel_to_assets_json
excel_to_assets_json("Asset_database.xlsx")
```

### Port Already in Use

**Issue:** "Address already in use" error

**Solution:** Change the port in `run.py`:
```python
app.run(debug=True, host='127.0.0.1', port=5001)
```

### Missing Database Files

**Issue:** "Database not found" errors

**Solution:** Ensure `Asset_database.json` and `Player_database.json` exist in the WebInterface directory. The Player database will be auto-created on first assignment if missing.

## Integration with DatabasePackage

The web interface directly uses the `DatabasePackage` module for all property assignments and data access. This provides seamless integration with the core backend logic while maintaining all validation and error-handling behavior.

## Dependencies

See [requirements.txt](requirements.txt) for the complete list of Python dependencies.

## License

See the parent project's LICENSE file.
