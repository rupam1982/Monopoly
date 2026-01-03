"""
Flask routes for Monopoly Web Interface
Handles API endpoints for asset assignment and data retrieval
"""

from flask import Blueprint, jsonify, request, render_template
import os
import io
import sys
from DatabasePackage import (
    assign_asset_to_player,
    get_areas as db_get_areas,
    get_assets as db_get_assets,
    get_players as db_get_players,
    get_player_assets as db_get_player_assets,
    get_database_state as db_get_database_state
)

# Create blueprints
api = Blueprint('api', __name__, url_prefix='/api')
main = Blueprint('main', __name__)

# Path to WebInterface databases (local to this folder)
WEBINTERFACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_DB = os.path.join(WEBINTERFACE_ROOT, 'DatabaseJson', 'Asset_database.json')
PLAYER_DB = os.path.join(WEBINTERFACE_ROOT, 'DatabaseJson', 'Player_database.json')


@api.route('/areas', methods=['GET'])
def get_areas():
    """Get all available areas from asset database"""
    areas, error = db_get_areas()
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({'areas': areas})


@api.route('/assets/<area>', methods=['GET'])
def get_assets(area):
    """Get all assets in a specific area"""
    assets, error = db_get_assets(area)
    if error:
        return jsonify({'error': error}), 404
    
    return jsonify({'assets': assets})


@api.route('/players', methods=['GET'])
def get_players():
    """Get all existing players from player database"""
    players = db_get_players()
    return jsonify({'players': players})


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
        
        # Capture printed output from the function
        captured_output = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = captured_output
        
        try:
            # Call the assign_asset_to_player function directly
            assign_asset_to_player(
                player_database_file=PLAYER_DB,
                player_name=player_name,
                area_name=area_name,
                asset_name=asset_name,
                houses=houses,
                asset_database_file=ASSET_DB
            )
            
            # Restore stdout and get the output
            sys.stdout = old_stdout
            output = captured_output.getvalue()
            
            # Parse output messages to determine status
            status = 'success'
            if 'ERROR:' in output:
                status = 'error'
            elif 'WARNING:' in output:
                status = 'warning'
            elif 'SUCCESS:' in output:
                status = 'success'
            
            return jsonify({
                'status': status,
                'message': output.strip()
            })
        except Exception as func_error:
            # Restore stdout in case of error
            sys.stdout = old_stdout
            raise func_error
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@api.route('/player-assets/<player>', methods=['GET'])
def get_player_assets(player):
    """Get all assets owned by a specific player"""
    assets = db_get_player_assets(player)
    return jsonify({'assets': assets})


@api.route('/database', methods=['GET'])
def get_database_state():
    """Get current state of both databases"""
    database_state = db_get_database_state()
    return jsonify(database_state)


@main.route('/', methods=['GET'])
def index():
    """Serve the main application page"""
    return render_template('index.html')
