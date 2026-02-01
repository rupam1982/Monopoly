"""
Player Manager Module
Handles player asset assignments and database management for Monopoly game.
"""

import json
import os
import pandas as pd


def excel_to_assets_json(excel_file: str, json_file: str = None) -> None:
    """
    Read an Excel file and produce JSON files for asset databases.
    
    Processes multiple sheets:
    - "Residential" sheet: Creates Asset_database.json with residential properties
      Structure: Area -> Asset -> {land_price, house_price, rent: {...}}
    - "Utilities" and "Transport" sheets: Creates Commercial_properties.json
      Structure: {Utilities: {asset: {...}}, Transport: {asset: {...}}}
    
    Saves the asset databases to JSON files in the same directory as the Excel file.
    """

    # Get the directory of the Excel file
    excel_dir = os.path.dirname(os.path.abspath(excel_file))
    if not excel_dir:
        excel_dir = os.getcwd()
    
    # Read all sheets from the Excel file
    excel_data = pd.read_excel(excel_file, sheet_name=None)
    
    # Initialize commercial properties dict to accumulate data from multiple sheets
    commercial_properties = {}
    
    # Process each sheet based on its name
    for sheet_name, df in excel_data.items():
        if sheet_name == "Residential":
            # Process Residential properties
            print(f"INFO: Processing '{sheet_name}' sheet for residential properties")
            
            df = df.copy()
            
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

            # Write residential assets to Asset_database.json
            output_file = os.path.join(excel_dir, "Asset_database.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(assets, f, indent=2)
            print(f"SUCCESS: Residential assets saved to {output_file}")
        
        elif sheet_name in ["Utilities", "Transport"]:
            # Process Commercial properties (Utilities or Transport)
            print(f"INFO: Processing '{sheet_name}' sheet for commercial properties")
            
            df = df.copy()
            
            # Drop columns that are entirely NaN
            df = df.dropna(axis=1, how='all')
            
            # Drop rows that are entirely NaN
            df = df.dropna(axis=0, how='all').reset_index(drop=True)
            
            # Find the header row (look for row containing 'Name' or 'Asset')
            header_row_idx = None
            for idx, row in df.iterrows():
                row_str = row.astype(str).str.lower()
                if 'name' in row_str.values or 'asset' in row_str.values:
                    header_row_idx = idx
                    break
            
            # Set the header row and drop everything before it
            if header_row_idx is not None:
                df.columns = df.iloc[header_row_idx].astype(str).str.strip()
                df = df.drop(df.index[:header_row_idx + 1]).reset_index(drop=True)
            
            # Drop any remaining rows that are entirely NaN
            df = df.dropna(axis=0, how='all').reset_index(drop=True)

            # Strip whitespace from object columns
            for col in df.select_dtypes(include=['object']).columns:
                df[col] = df[col].astype(str).str.strip()

            # Build the commercial properties structure
            commercial_properties[sheet_name] = {}
            
            # Process each row to build the asset structure
            for _, row in df.iterrows():
                # Get asset name (could be in 'Name' or 'Asset' column)
                asset_name = None
                for col_name in ['Name', 'Asset', 'Property']:
                    if col_name in df.columns:
                        asset_name = str(row[col_name]).strip()
                        if asset_name and asset_name != 'nan':
                            break
                
                if not asset_name or asset_name == 'nan':
                    continue
                
                # Initialize asset dict
                asset_data = {}
                
                # Get price if available
                if 'Price' in df.columns:
                    price_val = pd.to_numeric(row['Price'], errors='coerce')
                    if not pd.isna(price_val):
                        asset_data['price'] = int(price_val)
                
                # Determine the revenue type (multiplier for Utilities, ticket for Transport)
                revenue_key = 'multiplier' if sheet_name == 'Utilities' else 'ticket'
                revenue_data = {}
                
                # Look for columns that represent different ownership levels
                # Patterns: "Multiplier:1", "Ticket:1", "1 owned", etc.
                for col in df.columns:
                    col_lower = col.lower()
                    
                    # Check for patterns like "Multiplier:1", "Ticket:1"
                    if 'multiplier:' in col_lower or 'ticket:' in col_lower:
                        # Extract the number after the colon
                        parts = col.split(':')
                        if len(parts) == 2:
                            num = parts[1].strip()
                            value = pd.to_numeric(row[col], errors='coerce')
                            if not pd.isna(value):
                                key = f"{num} owned"
                                revenue_data[key] = int(value)
                    
                    # Check for patterns like "1 owned", "2 owned"
                    elif 'owned' in col_lower:
                        value = pd.to_numeric(row[col], errors='coerce')
                        if not pd.isna(value):
                            revenue_data[col.strip()] = int(value)
                    
                    # Check for standalone numbers
                    elif col in ['1', '2', '3', '4']:
                        value = pd.to_numeric(row[col], errors='coerce')
                        if not pd.isna(value):
                            revenue_data[f"{col} owned"] = int(value)
                
                if revenue_data:
                    asset_data[revenue_key] = revenue_data
                
                commercial_properties[sheet_name][asset_name] = asset_data
            
            print(f"SUCCESS: {sheet_name} properties processed ({len(commercial_properties[sheet_name])} assets)")
        
        else:
            print(f"WARNING: Skipping unrecognized sheet '{sheet_name}'")
    
    # Write commercial properties to Commercial_properties.json if any were processed
    if commercial_properties:
        output_file = os.path.join(excel_dir, "Commercial_properties.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commercial_properties, f, indent=2)
        print(f"SUCCESS: Commercial properties saved to {output_file}")


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
    
    # Ensure both players have account entries
    if paying_player not in player_accounts:
        player_accounts[paying_player] = []
    if receiving_player not in player_accounts:
        player_accounts[receiving_player] = []
    
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
