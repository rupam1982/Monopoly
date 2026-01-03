"""
Flask routes for Monopoly Web Interface
Handles API endpoints for asset assignment and data retrieval
"""

from flask import Blueprint, jsonify, request, render_template
import json
import os
import subprocess
import sys

# Create blueprints
api = Blueprint('api', __name__, url_prefix='/api')
main = Blueprint('main', __name__)

# Path to project databases and scripts
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSET_DB = os.path.join(PROJECT_ROOT, 'Asset_database.json')
PLAYER_DB = os.path.join(PROJECT_ROOT, 'Player_database.json')
CLI_SCRIPT = os.path.join(PROJECT_ROOT, 'player_asset_assignment.py')


def load_asset_database():
    """Load asset database from JSON file"""
    if not os.path.exists(ASSET_DB):
        return None
    try:
        with open(ASSET_DB, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading asset database: {e}")
        return None


def load_player_database():
    """Load player database from JSON file"""
    if not os.path.exists(PLAYER_DB):
        return {}
    try:
        with open(PLAYER_DB, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading player database: {e}")
        return {}


@api.route('/areas', methods=['GET'])
def get_areas():
    """Get all available areas from asset database"""
    asset_db = load_asset_database()
    if asset_db is None:
        return jsonify({'error': 'Asset database not found'}), 404
    
    areas = list(asset_db.keys())
    return jsonify({'areas': sorted(areas)})


@api.route('/assets/<area>', methods=['GET'])
def get_assets(area):
    """Get all assets in a specific area"""
    asset_db = load_asset_database()
    if asset_db is None:
        return jsonify({'error': 'Asset database not found'}), 404
    
    if area not in asset_db:
        return jsonify({'error': f'Area "{area}" not found'}), 404
    
    assets = list(asset_db[area].keys())
    return jsonify({'assets': sorted(assets)})


@api.route('/players', methods=['GET'])
def get_players():
    """Get all existing players from player database"""
    player_db = load_player_database()
    players = list(player_db.keys())
    return jsonify({'players': sorted(players)})


@api.route('/assign', methods=['POST'])
def assign_asset():
    """
    Assign an asset to a player by calling the CLI script
    Expects JSON payload with: player_name, area_name, asset_name, houses
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['player_name', 'area_name', 'asset_name', 'houses']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        player_name = str(data['player_name']).strip()
        area_name = str(data['area_name']).strip()
        asset_name = str(data['asset_name']).strip()
        houses = int(data['houses'])
        
        # Validate inputs
        if not player_name or not area_name or not asset_name:
            return jsonify({'error': 'Player, area, and asset names cannot be empty'}), 400
        
        if houses < 0 or houses > 4:
            return jsonify({'error': 'Houses must be between 0 and 4'}), 400
        
        # Call the CLI script
        result = subprocess.run(
            [
                sys.executable, CLI_SCRIPT,
                '--player', player_name,
                '--area', area_name,
                '--asset', asset_name,
                '--houses', str(houses),
                '--player_db', PLAYER_DB,
                '--asset_db', ASSET_DB
            ],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        
        # Parse output messages
        output = result.stdout + result.stderr
        status = 'success'
        
        if 'ERROR:' in output:
            status = 'error'
        elif 'WARNING:' in output:
            status = 'warning'
        elif 'SUCCESS:' in output:
            status = 'success'
        
        return jsonify({
            'status': status,
            'message': output.strip(),
            'return_code': result.returncode
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@api.route('/player-assets/<player>', methods=['GET'])
def get_player_assets(player):
    """Get all assets owned by a specific player"""
    player_db = load_player_database()
    
    if player not in player_db:
        return jsonify({'assets': {}})
    
    return jsonify({'assets': player_db[player]})


@api.route('/database', methods=['GET'])
def get_database_state():
    """Get current state of both databases"""
    asset_db = load_asset_database()
    player_db = load_player_database()
    
    return jsonify({
        'asset_database': asset_db if asset_db else {},
        'player_database': player_db
    })


@main.route('/', methods=['GET'])
def index():
    """Serve the main application page"""
    return render_template('index.html')
