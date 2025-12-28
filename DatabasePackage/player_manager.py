"""
Player Manager Module
Handles player asset assignments and database management for Monopoly game.
"""

import json
import os


def validate_asset_exists(asset_database_file: str, area_name: str, asset_name: str) -> bool:
    """
    Validate if an asset exists in the asset database under a specific area.
    
    Args:
        asset_database_file: Path to the asset database JSON file
        area_name: Name of the area to check
        asset_name: Name of the asset to validate
    
    Returns:
        True if asset exists under the area, False otherwise
    """
    if not os.path.exists(asset_database_file):
        print(f"WARNING: Asset database file '{asset_database_file}' not found. Skipping asset validation.")
        return True
    
    try:
        with open(asset_database_file, 'r', encoding='utf-8') as f:
            asset_database = json.load(f)
        
        # Check if area exists and asset exists under that area
        if area_name in asset_database:
            if asset_name in asset_database[area_name]:
                return True
        
        return False
    except (json.JSONDecodeError, IOError) as e:
        print(f"WARNING: Error reading asset database: {e}. Skipping asset validation.")
        return True


def assign_asset_to_player(player_database_file: str = "Player_database.json", *, player_name: str, area_name: str, asset_name: str, houses: int, asset_database_file: str = None) -> dict:
    """
    Assign an asset with a specified number of houses to a player in a specific area.
    If the player already owns the asset, add the houses to the existing count.
    Houses are capped at a maximum of 4 per asset.
    
    Args:
        player_database_file: Path to JSON file containing the player database.
                             Defaults to "Player_database.json".
                             If file doesn't exist, an empty database is initialized.
        player_name: Name of the player
        area_name: Name of the area containing the asset
        asset_name: Name of the asset to assign
        houses: Number of houses to add to the asset (must be >= 0)
        asset_database_file: Path to JSON file containing the asset database for validation.
                            Defaults to None (no validation). If provided, validates that
                            the asset exists under the specified area.
    
    Returns:
        Updated player database dictionary after the assignment
        
    Note:
        - If the asset is already assigned to another player, an error is printed
          and the assignment is NOT made.
        - If the asset is already owned by the same player, the houses are ADDED
          to the existing count.
        - If total houses exceed 4, a warning is printed and the total is capped at 4.
        - If asset_database_file is provided and asset doesn't exist, an error is printed
          and the assignment is NOT made.
        - The updated database is saved back to the JSON file.
        - Database structure: {player_name: {area_name: {asset_name: {houses: count}}}}
    """
    
    # Load existing player database or initialize empty one
    if os.path.exists(player_database_file):
        with open(player_database_file, 'r', encoding='utf-8') as f:
            player_database = json.load(f)
        print(f"INFO: Loaded player database from '{player_database_file}'")
    else:
        player_database = {}
        print(f"INFO: Created new player database (file '{player_database_file}' did not exist)")
    
    # Validate houses input
    if not isinstance(houses, int) or houses < 0:
        raise ValueError("Houses must be a non-negative integer")
    
    # Validate asset exists in asset database if provided
    if asset_database_file is not None:
        if not validate_asset_exists(asset_database_file, area_name, asset_name):
            print(f"ERROR: Asset '{asset_name}' does not exist under area '{area_name}' in asset database '{asset_database_file}'.")
            return player_database
    
    # Check if asset is already assigned to another player
    for other_player in player_database:
        if other_player != player_name:
            for other_area in player_database[other_player]:
                if asset_name in player_database[other_player][other_area]:
                    print(f"ERROR: Asset '{asset_name}' is already assigned to player '{other_player}' in area '{other_area}'. Assignment to '{player_name}' DENIED.")
                    return player_database
    
    # Create player entry if doesn't exist
    if player_name not in player_database:
        player_database[player_name] = {}
    
    # Create area entry if doesn't exist
    if area_name not in player_database[player_name]:
        player_database[player_name][area_name] = {}
    
    # Check if same player already owns this asset in this area
    if asset_name in player_database[player_name][area_name]:
        existing_houses = player_database[player_name][area_name][asset_name]['houses']
        new_total = existing_houses + houses
        
        # Check if total exceeds 4 and cap it
        if new_total > 4:
            print(f"WARNING: Adding {houses} houses to asset '{asset_name}' ({area_name}) for player '{player_name}' would result in {new_total} houses, but maximum is 4. Capping at 4.")
            new_total = 4
        
        print(f"INFO: Adding {houses} houses to asset '{asset_name}' ({area_name}) for player '{player_name}': {existing_houses} + {houses} = {new_total} houses")
        player_database[player_name][area_name][asset_name] = {"houses": new_total}
    else:
        # Check if initial assignment exceeds 4
        if houses > 4:
            print(f"WARNING: Assigning {houses} houses to asset '{asset_name}' ({area_name}) exceeds maximum of 4. Capping at 4.")
            houses = 4
        
        print(f"SUCCESS: Asset '{asset_name}' ({area_name}) assigned to player '{player_name}' with {houses} houses")
        player_database[player_name][area_name][asset_name] = {"houses": houses}
    
    # Save updated database back to file
    with open(player_database_file, 'w', encoding='utf-8') as f:
        json.dump(player_database, f, indent=2)
    print(f"INFO: Player database saved to '{player_database_file}'")
    
    return player_database
