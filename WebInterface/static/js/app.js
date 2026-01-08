/**
 * Monopoly Web Interface - Frontend Logic
 * Handles UI interactions and API communication
 */

const API_BASE = '/api';

// DOM Elements - will be initialized after DOM loads
let playerSelect, playerInput, areaSelect, assetSelect, housesSelect;
let assignBtn, payRentBtn, resetBtn, refreshBtn, startGameBtn;
let messageArea, messageContent, playerDbContent;
let errorDetailsBox, errorDetailsContent, closeErrorBox;
let pythonOutputBox, pythonOutputContent, closeOutputBox;
let rentMessage;

// State
let availableAreas = [];
let assetsByArea = {};
let selectedArea = null;
let currentPlayerDb = {}; // Store current database for dynamic filtering

/**
 * Initialize the application
 */
async function init() {
    // Initialize DOM elements
    playerSelect = document.getElementById('player-select');
    playerInput = document.getElementById('player-input');
    areaSelect = document.getElementById('area-select');
    assetSelect = document.getElementById('asset-select');
    housesSelect = document.getElementById('houses-select');
    assignBtn = document.getElementById('assign-btn');
    payRentBtn = document.getElementById('pay-rent-btn');
    resetBtn = document.getElementById('reset-btn');
    refreshBtn = document.getElementById('refresh-btn');
    startGameBtn = document.getElementById('start-game-btn');
    messageArea = document.getElementById('message-area');
    messageContent = document.getElementById('message-content');
    playerDbContent = document.getElementById('player-db-content');
    errorDetailsBox = document.getElementById('error-details-box');
    errorDetailsContent = document.getElementById('error-details-content');
    closeErrorBox = document.getElementById('close-error-box');
    pythonOutputBox = document.getElementById('python-output-box');
    pythonOutputContent = document.getElementById('python-output-content');
    closeOutputBox = document.getElementById('close-output-box');
    rentMessage = document.getElementById('rent-message');

    // Debug: Check if boxes were found
    console.log('Error box element:', errorDetailsBox);
    console.log('Python output box element:', pythonOutputBox);

    await loadAreas();
    await loadPlayers();
    await loadDatabase();
    setupEventListeners();
}

/**
 * Load all areas from the API
 */
async function loadAreas() {
    try {
        const response = await fetch(`${API_BASE}/areas`);
        const data = await response.json();
        availableAreas = data.areas || [];

        // Pre-load assets for all areas
        for (const area of availableAreas) {
            await loadAssetsForArea(area);
        }
    } catch (error) {
        showMessage('error', `Failed to load areas: ${error.message}`);
    }
}

/**
 * Load assets for a specific area
 */
async function loadAssetsForArea(area) {
    try {
        const response = await fetch(`${API_BASE}/assets/${encodeURIComponent(area)}`);
        const data = await response.json();
        assetsByArea[area] = data.assets || [];
    } catch (error) {
        console.error(`Failed to load assets for ${area}:`, error);
    }
}

/**
 * Load all existing players from the API
 */
async function loadPlayers() {
    try {
        const response = await fetch(`${API_BASE}/players`);
        const data = await response.json();
        const players = data.players || [];

        // Populate player dropdown
        playerSelect.innerHTML = '<option value="">-- Select Player --</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            playerSelect.appendChild(option);
        });

        // Add "Other player" option
        const otherOption = document.createElement('option');
        otherOption.value = '__new_player__';
        otherOption.textContent = '+ Add New Player';
        playerSelect.appendChild(otherOption);
    } catch (error) {
        showMessage('error', `Failed to load players: ${error.message}`);
    }
}

/**
 * Populate area dropdown
 */
function populateAreaDropdown() {
    areaSelect.innerHTML = '<option value="">-- Select Area --</option>';
    availableAreas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
    });
}

/**
 * Populate asset dropdown based on selected area
 */
function populateAssetDropdown() {
    assetSelect.innerHTML = '<option value="">-- Select Property --</option>';

    if (selectedArea && assetsByArea[selectedArea]) {
        assetsByArea[selectedArea].forEach(asset => {
            const option = document.createElement('option');
            option.value = asset;
            option.textContent = asset;
            assetSelect.appendChild(option);
        });
    }
}

/**
 * Check if all required fields are filled and enable/disable appropriate button
 */
function updateAssignButtonState() {
    const playerSelected = playerSelect.value && playerSelect.value !== '__new_player__';
    const newPlayerFilled = playerSelect.value === '__new_player__' && playerInput.value.trim();
    const playerOk = playerSelected || newPlayerFilled;

    const areaSelected = areaSelect.value;
    const assetSelected = assetSelect.value;
    const housesSelected = housesSelect.value !== '';

    // Only enable Assign button if all fields are filled AND houses is not disabled
    if (playerOk && areaSelected && assetSelected && housesSelected && !housesSelect.disabled) {
        assignBtn.disabled = false;
        assignBtn.style.display = 'inline-block';
        payRentBtn.disabled = true;
        payRentBtn.style.display = 'none';
    } else if (!housesSelected && assetSelected && playerOk && areaSelected) {
        // Asset selected but houses not selected - buttons already set by handleAssetChange
        // Don't change button states here
    } else {
        // Not all required fields filled
        assignBtn.disabled = true;
        assignBtn.style.display = 'inline-block';
        payRentBtn.disabled = true;
        payRentBtn.style.display = 'none';
    }
}

/**
 * Find the current owner of an asset
 */
function findAssetOwner(area, asset) {
    for (const player in currentPlayerDb) {
        if (currentPlayerDb[player][area] && currentPlayerDb[player][area][asset]) {
            return player;
        }
    }
    return null;
}

/**
 * Handle player selection change
 */
function handlePlayerChange() {
    if (playerSelect.value === '__new_player__') {
        playerInput.classList.add('active');
        playerInput.focus();
    } else {
        playerInput.classList.remove('active');
        playerInput.value = '';
    }

    // Always show areas after player selection
    if (playerSelect.value) {
        areaSelect.disabled = false;
        populateAreaDropdown();
    } else {
        areaSelect.disabled = true;
        assetSelect.disabled = true;
        housesSelect.disabled = true;
    }

    updateAssignButtonState();
}

/**
 * Handle area selection change
 */
function handleAreaChange() {
    selectedArea = areaSelect.value;

    if (selectedArea) {
        assetSelect.disabled = false;
        populateAssetDropdown();
    } else {
        assetSelect.disabled = true;
        housesSelect.disabled = true;
        assetSelect.value = '';
        housesSelect.value = '';
    }

    updateAssignButtonState();
}

/**
 * Handle asset selection change
 */
function handleAssetChange() {
    if (assetSelect.value) {
        // Check ownership when asset is selected
        const playerSelected = playerSelect.value && playerSelect.value !== '__new_player__';
        const newPlayerFilled = playerSelect.value === '__new_player__' && playerInput.value.trim();
        const playerOk = playerSelected || newPlayerFilled;

        if (playerOk) {
            const currentPlayerName = playerSelect.value === '__new_player__'
                ? playerInput.value.trim()
                : playerSelect.value;

            const areaSelected = areaSelect.value;
            const assetSelected = assetSelect.value;
            const owner = findAssetOwner(areaSelected, assetSelected);

            if (owner && owner !== currentPlayerName) {
                // Asset owned by another player - disable houses, enable Pay Rent
                housesSelect.disabled = true;
                housesSelect.value = '';
                assignBtn.disabled = true;
                assignBtn.style.display = 'none';
                payRentBtn.disabled = false;
                payRentBtn.style.display = 'inline-block';

                // Display rent message immediately
                displayRentMessage(currentPlayerName, areaSelected, assetSelected, owner);
            } else {
                // Asset not owned or owned by current player - enable houses
                housesSelect.disabled = false;
                assignBtn.style.display = 'inline-block';
                payRentBtn.style.display = 'none';
                rentMessage.textContent = ''; // Clear rent message
                updateAssignButtonState();
            }
        } else {
            housesSelect.disabled = false;
        }
    } else {
        housesSelect.disabled = true;
        housesSelect.value = '';
        updateAssignButtonState();
    }
}

/**
 * Handle houses selection change
 */
function handleHousesChange() {
    updateAssignButtonState();
}

/**
 * Handle input change (new player name)
 */
function handlePlayerInputChange() {
    updateAssignButtonState();
}

/**
 * Display a message to the user
 */
function showMessage(type, text) {
    messageArea.className = `message-area show ${type}`;
    messageContent.textContent = text;
    messageArea.style.display = 'block';
}

/**
 * Clear message display
 */
function clearMessage() {
    messageArea.style.display = 'none';
    messageArea.className = 'message-area';
}

/**
 * Show error details in dedicated box
 */
function showErrorDetails(errorText) {
    console.log('showErrorDetails called with:', errorText);
    errorDetailsContent.innerHTML = `<pre>${escapeHtml(errorText)}</pre>`;
    errorDetailsBox.style.display = 'block';
    console.log('Error box display set to:', errorDetailsBox.style.display);
}

/**
 * Hide error details box
 */
function hideErrorDetails() {
    console.log('hideErrorDetails called');
    errorDetailsBox.style.display = 'none';
}

/**
 * Show Python output in dedicated box
 */
function showPythonOutput(outputText) {
    console.log('showPythonOutput called with:', outputText);
    pythonOutputContent.innerHTML = `<pre>${escapeHtml(outputText)}</pre>`;
    pythonOutputBox.style.display = 'block';
    console.log('Python output box display set to:', pythonOutputBox.style.display);
}

/**
 * Hide Python output box
 */
function hidePythonOutput() {
    console.log('hidePythonOutput called');
    pythonOutputBox.style.display = 'none';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Reset form to initial state
 */
function resetForm() {
    playerSelect.value = '';
    playerInput.value = '';
    playerInput.classList.remove('active');
    areaSelect.value = '';
    areaSelect.disabled = true;
    assetSelect.value = '';
    assetSelect.disabled = true;
    housesSelect.value = '';
    housesSelect.disabled = true;
    clearMessage();
    rentMessage.textContent = ''; // Clear rent message
    // Don't auto-hide error box - let user close it manually
    updateAssignButtonState();
}

/**
 * Handle assign button click
 */
async function handleAssign() {
    const playerName = playerSelect.value === '__new_player__'
        ? playerInput.value.trim()
        : playerSelect.value;

    const areaName = areaSelect.value;
    const assetName = assetSelect.value;
    const houses = parseInt(housesSelect.value);

    // Validate
    if (!playerName || !areaName || !assetName || houses === '') {
        showErrorDetails('Please fill in all fields');
        return;
    }

    // Disable button during request
    assignBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName,
                area_name: areaName,
                asset_name: assetName,
                houses: houses
            })
        });

        const data = await response.json();

        // Always show Python output if available
        if (data.message) {
            showPythonOutput(data.message);
        }

        // Show in error details for errors
        if (data.status === 'error') {
            if (data.message) {
                showErrorDetails(data.message);
            }
        }

        // Refresh players and database after successful assignment
        if (response.ok && data.status !== 'error') {
            setTimeout(async () => {
                await loadPlayers();
                await loadDatabase();
                resetForm();
            }, 1500);
        } else {
            updateAssignButtonState();
        }
    } catch (error) {
        const errorMsg = `Assignment failed: ${error.message}`;
        showErrorDetails(`Network Error:\n${error.message}\n\nStack Trace:\n${error.stack || 'Not available'}`);
        updateAssignButtonState();
    }
}

/**
 * Handle pay rent button click
 */
async function handlePayRent() {
    // Extract information from current selections
    const payingPlayer = playerSelect.value === '__new_player__'
        ? playerInput.value.trim()
        : playerSelect.value;
    const areaSelected = areaSelect.value;
    const assetSelected = assetSelect.value;

    if (!payingPlayer || !areaSelected || !assetSelected) {
        showErrorDetails('Missing player, area, or asset information');
        return;
    }

    // Find the owner of the asset
    const owner = findAssetOwner(areaSelected, assetSelected);

    if (!owner) {
        showErrorDetails('Could not determine asset owner');
        return;
    }

    // Get the number of houses from the database
    const ownerData = currentPlayerDb[owner];
    const houses = ownerData && ownerData[areaSelected] && ownerData[areaSelected][assetSelected]
        ? ownerData[areaSelected][assetSelected].houses || 0
        : 0;

    // Calculate rent amount
    const rentAmount = await calculateRent(areaSelected, assetSelected, houses);

    if (rentAmount === null) {
        showErrorDetails('Could not calculate rent amount');
        return;
    }

    // Disable button during request
    payRentBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/pay-rent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paying_player: payingPlayer,
                receiving_player: owner,
                rent_amount: rentAmount
            }),
        });

        const result = await response.json();

        if (result.error) {
            showErrorDetails(result.error);
        } else if (result.message) {
            // Display the transaction message in the same space as the earlier rent message
            rentMessage.textContent = result.message;
        }
    } catch (error) {
        showErrorDetails(`Network error: ${error.message}`);
    } finally {
        // Re-enable button
        payRentBtn.disabled = false;
    }
}

/**
 * Display rent message for an asset
 */
async function displayRentMessage(playerName, areaName, assetName, owner) {
    // Get the number of houses from the database
    const ownerData = currentPlayerDb[owner];
    const houses = ownerData && ownerData[areaName] && ownerData[areaName][assetName]
        ? ownerData[areaName][assetName].houses || 0
        : 0;

    // Get rent amount based on houses
    const rentAmount = await calculateRent(areaName, assetName, houses);

    if (rentAmount === null) {
        rentMessage.textContent = 'Could not calculate rent';
        return;
    }

    // Display rent payment message inline
    const rentMsg = `Player "${playerName}" pays $${rentAmount} rent to "${owner}" for "${assetName}" on "${areaName}" (${houses} houses)`;
    rentMessage.textContent = rentMsg;
}

/**
 * Calculate rent for an asset based on number of houses
 */
async function calculateRent(area, asset, houses) {
    try {
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const assetDb = data.asset_database || {};

        if (assetDb[area] && assetDb[area][asset]) {
            const assetInfo = assetDb[area][asset];
            const rentInfo = assetInfo.rent || {};

            // Map houses to rent keys
            const rentKeys = {
                0: 'no_houses',
                1: 'one_house',
                2: 'two_houses',
                3: 'three_houses',
                4: 'four_houses'
            };

            const rentKey = rentKeys[houses];
            return rentInfo[rentKey] || 0;
        }
        return null;
    } catch (error) {
        console.error('Error calculating rent:', error);
        return null;
    }
}

/**
 * Load and display the database state
 */
async function loadDatabase() {
    try {
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const playerDb = data.player_database || {};

        if (Object.keys(playerDb).length === 0) {
            playerDbContent.innerHTML = '<p class="empty">No players or properties assigned yet.</p>';
        } else {
            // Collect unique players and streets
            const uniquePlayers = new Set();
            const uniqueStreets = new Set();

            for (const player in playerDb) {
                uniquePlayers.add(player);
                for (const street in playerDb[player]) {
                    uniqueStreets.add(street);
                }
            }

            // Build dropdown options
            const playerOptions = Array.from(uniquePlayers).sort().map(p =>
                `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`
            ).join('');

            const streetOptions = Array.from(uniqueStreets).sort().map(s =>
                `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
            ).join('');

            // Build table
            let tableHTML = `
                <table class="db-table" id="database-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Street</th>
                            <th>Asset Name</th>
                            <th>No of Houses</th>
                        </tr>
                        <tr class="filter-row">
                            <th>
                                <select class="table-filter" id="filter-player">
                                    <option value="">All Players</option>
                                    ${playerOptions}
                                </select>
                            </th>
                            <th>
                                <select class="table-filter" id="filter-street">
                                    <option value="">All Streets</option>
                                    ${streetOptions}
                                </select>
                            </th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="table-body">
            `;

            // Iterate through players, streets, and assets
            for (const player in playerDb) {
                for (const street in playerDb[player]) {
                    for (const asset in playerDb[player][street]) {
                        const houses = playerDb[player][street][asset].houses || 0;
                        tableHTML += `
                            <tr>
                                <td data-label="player">${escapeHtml(player)}</td>
                                <td data-label="street">${escapeHtml(street)}</td>
                                <td data-label="asset">${escapeHtml(asset)}</td>
                                <td data-label="houses">${houses}</td>
                            </tr>
                        `;
                    }
                }
            }

            tableHTML += `
                    </tbody>
                </table>
            `;

            playerDbContent.innerHTML = tableHTML;

            // Store database for filter updates
            currentPlayerDb = playerDb;

            // Setup filter listeners
            setupTableFilters(playerDb);
        }
    } catch (error) {
        playerDbContent.innerHTML = `<p class="error">Failed to load database: ${error.message}</p>`;
    }
}

/**
 * Setup table filter functionality
 */
function setupTableFilters(playerDb) {
    const filterInputs = {
        player: document.getElementById('filter-player'),
        street: document.getElementById('filter-street')
    };

    // Add event listener to player filter to update street options
    if (filterInputs.player) {
        filterInputs.player.addEventListener('change', () => {
            updateStreetFilterOptions(filterInputs.player.value, playerDb);
            filterTable(filterInputs);
        });
    }

    // Add event listener to street filter
    if (filterInputs.street) {
        filterInputs.street.addEventListener('change', () => filterTable(filterInputs));
    }
}

/**
 * Update street filter dropdown based on selected player
 */
function updateStreetFilterOptions(selectedPlayer, playerDb) {
    const streetFilter = document.getElementById('filter-street');
    if (!streetFilter) return;

    // Clear current selection
    streetFilter.value = '';

    if (!selectedPlayer) {
        // Show all streets if no player selected
        const allStreets = new Set();
        for (const player in playerDb) {
            for (const street in playerDb[player]) {
                allStreets.add(street);
            }
        }

        const streetOptions = Array.from(allStreets).sort().map(s =>
            `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
        ).join('');

        streetFilter.innerHTML = `<option value="">All Streets</option>${streetOptions}`;
    } else {
        // Show only streets for the selected player
        const playerStreets = new Set();
        if (playerDb[selectedPlayer]) {
            for (const street in playerDb[selectedPlayer]) {
                playerStreets.add(street);
            }
        }

        const streetOptions = Array.from(playerStreets).sort().map(s =>
            `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
        ).join('');

        streetFilter.innerHTML = `<option value="">All Streets</option>${streetOptions}`;
    }
}

/**
 * Filter table rows based on filter inputs
 */
function filterTable(filterInputs) {
    const filters = {
        player: filterInputs.player.value,
        street: filterInputs.street.value
    };

    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        if (cells.length === 0) continue;

        const playerText = cells[0].textContent;
        const streetText = cells[1].textContent;

        const matchesPlayer = !filters.player || playerText === filters.player;
        const matchesStreet = !filters.street || streetText === filters.street;

        if (matchesPlayer && matchesStreet) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    playerSelect.addEventListener('change', handlePlayerChange);
    playerInput.addEventListener('input', handlePlayerInputChange);
    areaSelect.addEventListener('change', handleAreaChange);
    assetSelect.addEventListener('change', handleAssetChange);
    housesSelect.addEventListener('change', handleHousesChange);
    assignBtn.addEventListener('click', handleAssign);
    payRentBtn.addEventListener('click', handlePayRent);
    resetBtn.addEventListener('click', () => {
        resetForm();
        hideErrorDetails(); // Hide error box when user clicks reset
        hidePythonOutput(); // Hide output box when user clicks reset
    });
    refreshBtn.addEventListener('click', loadDatabase);
    startGameBtn.addEventListener('click', handleStartGame);
    closeErrorBox.addEventListener('click', hideErrorDetails);
    closeOutputBox.addEventListener('click', hidePythonOutput);

    // Allow Enter key to submit
    housesSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !assignBtn.disabled) {
            handleAssign();
        }
    });
}

/**
 * Handle Start Game button click
 */
async function handleStartGame() {
    // Confirm with user
    const confirmed = confirm('This will reset all player properties and accounts. Are you sure you want to start a new game?');

    if (!confirmed) {
        return;
    }

    // Disable button during request
    startGameBtn.disabled = true;
    startGameBtn.textContent = 'Starting...';

    try {
        const response = await fetch(`${API_BASE}/start-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.error) {
            showErrorDetails(result.error);
        } else if (result.message) {
            showPythonOutput(result.message);

            // Reload the database to reflect changes
            await loadDatabase();
            await loadPlayers();

            // Reset the form
            resetForm();
        }
    } catch (error) {
        showErrorDetails(`Network error: ${error.message}`);
    } finally {
        // Re-enable button
        startGameBtn.disabled = false;
        startGameBtn.textContent = 'Start Game';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
