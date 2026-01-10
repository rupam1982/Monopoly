"""
Player Manager Module
Handles player asset assignments and database management for Monopoly game.
"""

import json
import os
import pandas as pd


def excel_to_assets_json(excel_file: str, json_file: str = None) -> None:
    """
    Read an Excel file and produce a JSON file capturing the asset database
    grouped by Area -> Asset -> {land_price, house_price, rent: {...}}.

    Saves the asset database to a JSON file.
    """

    # Read all sheets and take the first sheet
    excel_data = pd.read_excel(excel_file, sheet_name=None)
    df = list(excel_data.values())[0].copy()

    # Drop columns that are entirely NaN
    df = df.dropna(axis=1, how='all')

    # If the first row contains header names like 'Area' and 'Asset', use it as header
    first_row = df.iloc[0].astype(str).str.strip()
    if {'Area', 'Asset'}.issubset(set(first_row.values)):
        df.columns = first_row
        df = df.drop(df.index[0]).reset_index(drop=True)

    # Replace empty strings with NA and drop rows that are entirely NA
    df = df.replace(r'^\s*$', pd.NA, regex=True).dropna(axis=0, how='all').reset_index(drop=True)

    # Strip whitespace from object columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()

    # Convert known numeric columns to integers where possible
    numeric_cols = ['Land price', 'House price', 'Rent: 0', 'Rent: 1', 'Rent: 2', 'Rent: 3', 'Rent: 4']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

    # Select only the required columns for asset structure
    required_columns = ['Area', 'Asset', 'Land price', 'House price', 'Rent: 0', 'Rent: 1', 'Rent: 2', 'Rent: 3', 'Rent: 4']
    existing_cols = [col for col in required_columns if col in df.columns]
    df = df[existing_cols].copy()

    # Drop rows with any NaN values in the selected columns and reset index
    df = df.dropna(how='any').reset_index(drop=True)

    # Build the assets JSON from the cleaned dataframe with Area as primary key
    assets = {}
    for _, row in df.iterrows():
        area = str(row['Area']).strip()
        asset_name = str(row['Asset']).strip()
        if area not in assets:
            assets[area] = {}
        assets[area][asset_name] = {
            "land_price": int(row['Land price']),
            "house_price": int(row['House price']),
            "rent": {
                "no_houses": int(row['Rent: 0']),
                "one_house": int(row['Rent: 1']),
                "two_houses": int(row['Rent: 2']),
                "three_houses": int(row['Rent: 3']),
                "four_houses": int(row['Rent: 4'])
            }
        }

    # Determine JSON filename if not provided and write file
    if json_file is None:
        json_file = os.path.splitext(excel_file)[0] + '.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(assets, f, indent=2)


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


def assign_asset_to_player(player_database_file: str = "Player_database.json", *, player_name: str, area_name: str, asset_name: str, houses: int, asset_database_file: str = None, player_accounts_file: str = None) -> dict:
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
        player_accounts_file: Path to JSON file containing the player accounts.
                             If provided and player is new, initializes account with $1500.
                             Defaults to None (no account initialization).
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
        
        # Initialize player account if player_accounts_file is provided
        if player_accounts_file is not None:
            # Load player accounts database
            if os.path.exists(player_accounts_file):
                with open(player_accounts_file, 'r', encoding='utf-8') as f:
                    player_accounts = json.load(f)
            else:
                player_accounts = {}
            
            # Add new player with starting balance if not already in accounts
            if player_name not in player_accounts:
                player_accounts[player_name] = [
                    {
                        "payment amount": 1500,
                        "payment source": "Treasurer"
                    }
                ]
                
                # Save updated accounts
                with open(player_accounts_file, 'w', encoding='utf-8') as f:
                    json.dump(player_accounts, f, indent=4)
                print(f"INFO: Created account for new player '{player_name}' with $1500 starting balance")
    
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
        
        # Calculate cost for additional houses only
        purchase_amount = 0
        if asset_database_file and player_accounts_file and os.path.exists(asset_database_file):
            with open(asset_database_file, 'r', encoding='utf-8') as f:
                asset_database = json.load(f)
            if area_name in asset_database and asset_name in asset_database[area_name]:
                house_price = asset_database[area_name][asset_name].get('house_price', 0)
                purchase_amount = house_price * houses
        
        print(f"INFO: Adding {houses} houses to asset '{asset_name}' ({area_name}) for player '{player_name}': {existing_houses} + {houses} = {new_total} houses")
        player_database[player_name][area_name][asset_name] = {"houses": new_total}
    else:
        # Calculate total purchase amount: land price + (house price * houses)
        purchase_amount = 0
        if asset_database_file and player_accounts_file and os.path.exists(asset_database_file):
            with open(asset_database_file, 'r', encoding='utf-8') as f:
                asset_database = json.load(f)
            if area_name in asset_database and asset_name in asset_database[area_name]:
                land_price = asset_database[area_name][asset_name].get('land_price', 0)
                house_price = asset_database[area_name][asset_name].get('house_price', 0)
                purchase_amount = land_price + (house_price * houses)
        
        # Check if initial assignment exceeds 4
        if houses > 4:
            print(f"WARNING: Assigning {houses} houses to asset '{asset_name}' ({area_name}) exceeds maximum of 4. Capping at 4.")
            houses = 4
        
        print(f"SUCCESS: Asset '{asset_name}' ({area_name}) assigned to player '{player_name}' with {houses} houses")
        player_database[player_name][area_name][asset_name] = {"houses": houses}
    
    # Record purchase transaction in player accounts
    if player_accounts_file and purchase_amount > 0:
        # Load player accounts database
        if os.path.exists(player_accounts_file):
            with open(player_accounts_file, 'r', encoding='utf-8') as f:
                player_accounts = json.load(f)
        else:
            player_accounts = {}
        
        # Ensure player has account entry
        if player_name not in player_accounts:
            player_accounts[player_name] = []
        
        # Add negative transaction (payment to Treasurer)
        player_accounts[player_name].append({
            "payment amount": -purchase_amount,
            "payment source": "Treasurer"
        })
        
        # Save updated accounts
        with open(player_accounts_file, 'w', encoding='utf-8') as f:
            json.dump(player_accounts, f, indent=4)
        
        print(f"INFO: Player '{player_name}' paid ${purchase_amount} to Treasurer for purchase")
    
    # Save updated database back to file
    with open(player_database_file, 'w', encoding='utf-8') as f:
        json.dump(player_database, f, indent=2)
    print(f"INFO: Player database saved to '{player_database_file}'")
    
    return player_database


def process_rent_payment(player_accounts_file: str, *, paying_player: str, receiving_player: str, rent_amount: int) -> None:
    """
    Process a rent payment transaction between two players.
    Updates the player accounts JSON file with the transaction details.
    
    Args:
        player_accounts_file: Path to the player accounts JSON file
        paying_player: Name of the player paying rent
        receiving_player: Name of the player receiving rent
        rent_amount: Amount of rent to be paid
    """
    # Load player accounts database
    if os.path.exists(player_accounts_file):
        with open(player_accounts_file, 'r', encoding='utf-8') as f:
            player_accounts = json.load(f)
    else:
        player_accounts = {}
        print(f"INFO: Created new player accounts database (file '{player_accounts_file}' did not exist)")
    
    # Ensure both players have account entries with initial balance
    if paying_player not in player_accounts:
        player_accounts[paying_player] = [
            {
                "payment amount": 1500,
                "payment source": "Treasurer"
            }
        ]
        print(f"INFO: Initialized player '{paying_player}' with $1500 starting balance")
    
    if receiving_player not in player_accounts:
        player_accounts[receiving_player] = [
            {
                "payment amount": 1500,
                "payment source": "Treasurer"
            }
        ]
        print(f"INFO: Initialized player '{receiving_player}' with $1500 starting balance")
    
    # Also ensure players exist in player database (with empty assets)
    player_db_file = player_accounts_file.replace('Player_accounts.json', 'Player_database.json')
    if os.path.exists(player_db_file):
        with open(player_db_file, 'r', encoding='utf-8') as f:
            player_db = json.load(f)
    else:
        player_db = {}
    
    # Initialize players in database if they don't exist
    if paying_player not in player_db:
        player_db[paying_player] = {}
        print(f"INFO: Created player '{paying_player}' entry in player database")
    
    if receiving_player not in player_db:
        player_db[receiving_player] = {}
        print(f"INFO: Created player '{receiving_player}' entry in player database")
    
    # Save player database if changes were made
    with open(player_db_file, 'w', encoding='utf-8') as f:
        json.dump(player_db, f, indent=2)
    
    # Add negative transaction to paying player's account
    player_accounts[paying_player].append({
        "payment amount": -rent_amount,
        "payment source": receiving_player
    })
    
    # Add positive transaction to receiving player's account
    player_accounts[receiving_player].append({
        "payment amount": rent_amount,
        "payment source": paying_player
    })
    
    # Save updated accounts back to file
    with open(player_accounts_file, 'w', encoding='utf-8') as f:
        json.dump(player_accounts, f, indent=4)
    
    print(f"Player {paying_player} has paid ${rent_amount} to Player {receiving_player}")
