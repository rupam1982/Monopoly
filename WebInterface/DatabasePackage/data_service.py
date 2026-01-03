"""
Data Service Module
Provides data access functions for the Monopoly Web Interface.
"""

import json
import os


# Path to WebInterface databases
WEBINTERFACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_DB = os.path.join(WEBINTERFACE_ROOT, 'DatabaseJson', 'Asset_database.json')
PLAYER_DB = os.path.join(WEBINTERFACE_ROOT, 'DatabaseJson', 'Player_database.json')


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


def get_areas():
    """
    Get all available areas from asset database
    
    Returns:
        tuple: (areas_list or None, error_message or None)
               If successful: (sorted list of areas, None)
               If failed: (None, error message string)
    """
    asset_db = load_asset_database()
    if asset_db is None:
        return None, 'Asset database not found'
    
    areas = list(asset_db.keys())
    return sorted(areas), None


def get_assets(area_name):
    """
    Get all assets in a specific area
    
    Args:
        area_name: Name of the area to get assets from
    
    Returns:
        tuple: (assets_list or None, error_message or None)
               If successful: (sorted list of assets, None)
               If failed: (None, error message string)
    """
    asset_db = load_asset_database()
    if asset_db is None:
        return None, 'Asset database not found'
    
    if area_name not in asset_db:
        return None, f'Area "{area_name}" not found'
    
    assets = list(asset_db[area_name].keys())
    return sorted(assets), None


def get_players():
    """
    Get all existing players from player database
    
    Returns:
        list: Sorted list of player names
    """
    player_db = load_player_database()
    players = list(player_db.keys())
    return sorted(players)


def get_player_assets(player_name):
    """
    Get all assets owned by a specific player
    
    Args:
        player_name: Name of the player
    
    Returns:
        dict: Dictionary of areas and assets owned by the player
              Returns empty dict if player not found
    """
    player_db = load_player_database()
    
    if player_name not in player_db:
        return {}
    
    return player_db[player_name]


def get_database_state():
    """
    Get current state of both databases
    
    Returns:
        dict: Dictionary containing both asset_database and player_database
    """
    asset_db = load_asset_database()
    player_db = load_player_database()
    
    return {
        'asset_database': asset_db if asset_db else {},
        'player_database': player_db
    }
