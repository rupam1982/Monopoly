"""
Player Asset Assignment Script
Command-line utility for assigning assets to players in the Monopoly game.
"""

import argparse
import sys
from DatabasePackage import assign_asset_to_player


def main():
    """
    Main function to handle command-line arguments and assign assets to players.
    """
    parser = argparse.ArgumentParser(
        description='Assign assets to players in the Monopoly game',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python player_asset_assignment.py --player "Player 1" --area "Street 1" --asset "Boardwalk" --houses 4
  python player_asset_assignment.py --player "Player 2" --area "Street 2" --asset "Park Place" --houses 2 --player_db custom_db.json
        """
    )
    
    parser.add_argument(
        '--player',
        required=True,
        type=str,
        help='Name of the player'
    )
    
    parser.add_argument(
        '--area',
        required=True,
        type=str,
        help='Name of the area containing the asset'
    )
    
    parser.add_argument(
        '--asset',
        required=True,
        type=str,
        help='Name of the asset to assign'
    )
    
    parser.add_argument(
        '--houses',
        required=True,
        type=int,
        help='Number of houses on the asset (must be >= 0, max 4)'
    )
    
    parser.add_argument(
        '--player_db',
        type=str,
        default='Player_database.json',
        help='Path to player database JSON file (default: Player_database.json)'
    )
    
    parser.add_argument(
        '--asset_db',
        type=str,
        default='Asset_database.json',
        help='Path to asset database JSON file for validation (default: Asset_database.json)'
    )
    
    # Parse arguments
    args = parser.parse_args()
    
    try:
        # Call the assign_asset_to_player function with command-line arguments
        assign_asset_to_player(
            player_database_file=args.player_db,
            player_name=args.player,
            area_name=args.area,
            asset_name=args.asset,
            houses=args.houses,
            asset_database_file=args.asset_db
        )
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
