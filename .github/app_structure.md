# Monopoly app architecture
1. This app will run in a browser
2. When action button is clicked on UI, python code will be called with appropriate CLI arguments pulled from user entry as described below.
3. All the python files, packages and entire contents for the app should be contained in a folder called WebInterface.
4. Generate a Readme.md in the root folder of the project describing the architecture of the app and the process for compiling and using it.

## User Input
1. Drop-down list of players in the game. There should be an option "Other player" which when selected, will allow writing a new player name.
2. Drop-down list of areas (streets). These are pulled from Asset_database.json.
3. Once an area is selected, this third drop-down list will have the possible assets in that area. Again, refer to the Asset_database.json. Before an area is selected, this box would be greyed out (disabled state)
4. After asset is selected, there will be a dropdown list of number of houses. Options will be 0, 1, 2, 3 and 4.
4. These three boxes along with their titles will be in one line and equally spaced and sized.

## Execution button
1. There will be an "Assign" button below these user input boxes.
2. This button will be greyed out until all valid selections are made.

## Execution action
1. Once the button is clicked, "player_asset_assignment.py" will be called with player name, area, asset and number of houses as CLI arguments and Player_database.json will be updated.