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

// Utility Action elements
let utilityPlayerSelect, utilityPlayerInput, assetTypeSelect, commercialAssetSelect;
let utilityResetBtn, utilityBuyBtn, utilityPayTicketBtn, utilityTicketMessage;

// State
let availableAreas = [];
let assetsByArea = {};
let selectedArea = null;
let currentPlayerDb = {}; // Store current database for dynamic filtering

// Utility Action state
let availableAssetTypes = [];
let commercialAssetsByType = {};
let selectedAssetType = null;

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

    // Initialize Utility Action DOM elements
    utilityPlayerSelect = document.getElementById('utility-player-select');
    utilityPlayerInput = document.getElementById('utility-player-input');
    assetTypeSelect = document.getElementById('asset-type-select');
    commercialAssetSelect = document.getElementById('commercial-asset-select');
    utilityResetBtn = document.getElementById('utility-reset-btn');
    utilityBuyBtn = document.getElementById('utility-buy-btn');
    utilityPayTicketBtn = document.getElementById('utility-pay-ticket-btn');
    utilityTicketMessage = document.getElementById('utility-ticket-message');

    await loadAreas();
    await loadPlayers();
    await loadAssetTypes();
    await loadDatabase();
    setupEventListeners();
    setupTabSwitching();
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

        // Populate utility player dropdown
        if (utilityPlayerSelect) {
            utilityPlayerSelect.innerHTML = '<option value="">-- Select Player --</option>';
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                option.textContent = player;
                utilityPlayerSelect.appendChild(option);
            });

            // Add "New Player" option
            const newUtilityPlayerOption = document.createElement('option');
            newUtilityPlayerOption.value = '__new_player__';
            newUtilityPlayerOption.textContent = '+ Add New Player';
            utilityPlayerSelect.appendChild(newUtilityPlayerOption);
        }
    } catch (error) {
        showMessage('error', `Failed to load players: ${error.message}`);
    }
}

/**
 * Load all asset types from commercial properties
 */
async function loadAssetTypes() {
    try {
        const response = await fetch(`${API_BASE}/commercial-asset-types`);
        const data = await response.json();
        availableAssetTypes = data.asset_types || [];

        // Pre-load commercial assets for all types
        for (const assetType of availableAssetTypes) {
            await loadCommercialAssetsForType(assetType);
        }
    } catch (error) {
        console.error('Failed to load asset types:', error);
    }
}

/**
 * Load commercial assets for a specific asset type
 */
async function loadCommercialAssetsForType(assetType) {
    try {
        const response = await fetch(`${API_BASE}/commercial-assets/${encodeURIComponent(assetType)}`);
        const data = await response.json();
        commercialAssetsByType[assetType] = data.assets || [];
    } catch (error) {
        console.error(`Failed to load commercial assets for ${assetType}:`, error);
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
 * Populate asset type dropdown for utility action
 */
function populateAssetTypeDropdown() {
    assetTypeSelect.innerHTML = '<option value="">-- Select Asset Type --</option>';
    availableAssetTypes.forEach(assetType => {
        const option = document.createElement('option');
        option.value = assetType;
        option.textContent = assetType;
        assetTypeSelect.appendChild(option);
    });
}

/**
 * Populate commercial asset dropdown based on selected asset type
 */
function populateCommercialAssetDropdown() {
    commercialAssetSelect.innerHTML = '<option value="">-- Select Asset Name --</option>';

    if (selectedAssetType && commercialAssetsByType[selectedAssetType]) {
        commercialAssetsByType[selectedAssetType].forEach(asset => {
            const option = document.createElement('option');
            option.value = asset;
            option.textContent = asset;
            commercialAssetSelect.appendChild(option);
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
 * Find owner of a commercial/utility asset
 */
function findCommercialAssetOwner(assetType, assetName) {
    for (const player in currentPlayerDb) {
        if (currentPlayerDb[player][assetType] && currentPlayerDb[player][assetType][assetName]) {
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
async function handleHousesChange() {
    // Check if this is a purchase scenario (not paying rent)
    if (housesSelect.value !== '' && !housesSelect.disabled) {
        const playerName = playerSelect.value === '__new_player__'
            ? playerInput.value.trim()
            : playerSelect.value;
        const areaName = areaSelect.value;
        const assetName = assetSelect.value;
        const houses = parseInt(housesSelect.value);

        if (playerName && areaName && assetName && houses >= 0) {
            // Display purchase amount message
            await displayPurchaseMessage(playerName, areaName, assetName, houses);
        }
    }
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

        // Update message with payment confirmation
        if (response.ok && data.status !== 'error') {
            // Extract payment info from message if available
            const playerName = playerSelect.value === '__new_player__'
                ? playerInput.value.trim()
                : playerSelect.value;
            const assetName = assetSelect.value;
            const houses = parseInt(housesSelect.value);
            const purchaseAmount = await calculatePurchaseAmount(areaSelect.value, assetName, houses);

            if (purchaseAmount > 0) {
                rentMessage.textContent = `Player "${playerName}" paid $${purchaseAmount} to Treasurer`;
                rentMessage.style.color = '#2e7d32'; // Green color for success
            }

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
            rentMessage.style.color = '#2e7d32'; // Green color for success

            // Refresh database and players, then reset form
            setTimeout(async () => {
                await loadDatabase();
                await loadPlayers();
                resetForm();
            }, 1500);
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
 * Calculate purchase amount for a property
 */
async function calculatePurchaseAmount(area, asset, houses) {
    try {
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const assetDb = data.asset_database || {};

        if (assetDb[area] && assetDb[area][asset]) {
            const assetInfo = assetDb[area][asset];
            const landPrice = assetInfo.land_price || 0;
            const housePrice = assetInfo.house_price || 0;
            return landPrice + (housePrice * houses);
        }
        return null;
    } catch (error) {
        console.error('Error calculating purchase amount:', error);
        return null;
    }
}

/**
 * Display purchase amount preview message for properties
 */
async function displayPurchaseMessage(playerName, areaName, assetName, houses) {
    const purchaseAmount = await calculatePurchaseAmount(areaName, assetName, houses);

    if (purchaseAmount === null) {
        rentMessage.textContent = 'Could not calculate purchase amount';
        return;
    }

    // Display purchase message inline
    const purchaseMsg = `Player "${playerName}" to pay $${purchaseAmount} to Treasurer for "${assetName}" on "${areaName}" (${houses} houses)`;
    rentMessage.textContent = purchaseMsg;
    rentMessage.style.color = '#d32f2f'; // Red color for payment messages
}

/**
 * Load and display the database state
 */
/**
 * Load and display player database
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

        // Also load transactions
        await loadTransactions();
    } catch (error) {
        playerDbContent.innerHTML = `<p class="error">Failed to load database: ${error.message}</p>`;
    }
}

/**
 * Load and display transactions
 */
async function loadTransactions() {
    const transactionsContent = document.getElementById('transactions-content');

    try {
        const response = await fetch(`${API_BASE}/transactions`);
        const data = await response.json();
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
            transactionsContent.innerHTML = '<p class="empty">No transactions recorded yet.</p>';
        } else {
            // Collect unique players and sources for filtering
            const uniquePlayers = new Set();
            const uniqueSources = new Set();

            transactions.forEach(t => {
                uniquePlayers.add(t.player);
                uniqueSources.add(t.source);
            });

            // Build dropdown options
            const playerOptions = Array.from(uniquePlayers).sort().map(p =>
                `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`
            ).join('');

            const sourceOptions = Array.from(uniqueSources).sort().map(s =>
                `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
            ).join('');

            // Build table
            let tableHTML = `
                <table class="db-table" id="transactions-table">
                    <thead>
                        <tr>
                            <th class="text-left">Player Name</th>
                            <th class="text-center">Transaction Amount</th>
                            <th class="text-left">Source</th>
                        </tr>
                        <tr class="filter-row">
                            <th>
                                <select class="table-filter" id="filter-txn-player">
                                    <option value="">All Players</option>
                                    ${playerOptions}
                                </select>
                            </th>
                            <th></th>
                            <th>
                                <select class="table-filter" id="filter-txn-source">
                                    <option value="">All Sources</option>
                                    ${sourceOptions}
                                </select>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="transactions-table-body">
            `;

            // Add transaction rows
            transactions.forEach(txn => {
                const amountClass = txn.amount >= 0 ? 'positive' : 'negative';
                tableHTML += `
                    <tr>
                        <td data-label="player" class="text-left">${escapeHtml(txn.player)}</td>
                        <td data-label="amount" class="text-center ${amountClass}">${txn.amount}</td>
                        <td data-label="source" class="text-left">${escapeHtml(txn.source)}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            transactionsContent.innerHTML = tableHTML;

            // Setup filter listeners for transactions
            setupTransactionFilters();
        }
    } catch (error) {
        transactionsContent.innerHTML = `<p class="error">Failed to load transactions: ${error.message}</p>`;
    }
}

/**
 * Setup transaction table filter functionality
 */
function setupTransactionFilters() {
    const filterInputs = {
        player: document.getElementById('filter-txn-player'),
        source: document.getElementById('filter-txn-source')
    };

    // Add event listeners
    if (filterInputs.player) {
        filterInputs.player.addEventListener('change', () => filterTransactionTable(filterInputs));
    }
    if (filterInputs.source) {
        filterInputs.source.addEventListener('change', () => filterTransactionTable(filterInputs));
    }
}

/**
 * Filter the transaction table based on selected filters
 */
function filterTransactionTable(filterInputs) {
    const selectedPlayer = filterInputs.player ? filterInputs.player.value : '';
    const selectedSource = filterInputs.source ? filterInputs.source.value : '';
    const tableBody = document.getElementById('transactions-table-body');

    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const playerCell = row.querySelector('[data-label="player"]');
        const sourceCell = row.querySelector('[data-label="source"]');

        if (!playerCell || !sourceCell) continue;

        const playerText = playerCell.textContent;
        const sourceText = sourceCell.textContent;

        const matchesPlayer = !selectedPlayer || playerText === selectedPlayer;
        const matchesSource = !selectedSource || sourceText === selectedSource;

        if (matchesPlayer && matchesSource) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Setup tab switching functionality
 */
function setupTabSwitching() {
    // Get all tab containers separately
    const tabContainers = document.querySelectorAll('.tab-container');

    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-btn');
        const tabContents = container.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');

                // Remove active class from buttons and contents within THIS container only
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const activeTab = document.getElementById(`${tabName}-tab`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
            });
        });
    });
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
 * Handle utility player selection change
 */
function handleUtilityPlayerChange() {
    if (utilityPlayerSelect.value === '__new_player__') {
        utilityPlayerInput.classList.add('active');
        utilityPlayerInput.focus();
    } else {
        utilityPlayerInput.classList.remove('active');
        utilityPlayerInput.value = '';
    }

    // Enable asset type dropdown after player selection
    if (utilityPlayerSelect.value) {
        assetTypeSelect.disabled = false;
        populateAssetTypeDropdown();
    } else {
        assetTypeSelect.disabled = true;
        commercialAssetSelect.disabled = true;
    }

    updateUtilityBuyButtonState();
}

/**
 * Handle utility player input change
 */
function handleUtilityPlayerInputChange() {
    if (utilityPlayerInput.value.trim()) {
        assetTypeSelect.disabled = false;
        populateAssetTypeDropdown();
    }

    updateUtilityBuyButtonState();
}

/**
 * Handle asset type selection change
 */
function handleAssetTypeChange() {
    selectedAssetType = assetTypeSelect.value;

    if (selectedAssetType) {
        commercialAssetSelect.disabled = false;
        populateCommercialAssetDropdown();
    } else {
        commercialAssetSelect.disabled = true;
        commercialAssetSelect.value = '';
    }

    updateUtilityBuyButtonState();
}

/**
 * Handle commercial asset selection change
 */
async function handleCommercialAssetChange() {
    if (commercialAssetSelect.value) {
        // Check ownership when commercial asset is selected
        const playerSelected = utilityPlayerSelect.value && utilityPlayerSelect.value !== '__new_player__';
        const newPlayerFilled = utilityPlayerSelect.value === '__new_player__' && utilityPlayerInput.value.trim();
        const playerOk = playerSelected || newPlayerFilled;

        if (playerOk) {
            const currentPlayerName = utilityPlayerSelect.value === '__new_player__'
                ? utilityPlayerInput.value.trim()
                : utilityPlayerSelect.value;

            const assetTypeSelected = assetTypeSelect.value;
            const assetSelected = commercialAssetSelect.value;
            const owner = findCommercialAssetOwner(assetTypeSelected, assetSelected);

            if (owner && owner !== currentPlayerName) {
                // Asset owned by another player - disable Buy, enable Pay Rent/Ticket
                utilityBuyBtn.disabled = true;
                utilityBuyBtn.style.display = 'none';
                utilityPayTicketBtn.disabled = false;
                utilityPayTicketBtn.style.display = 'inline-block';

                // Display ticket message immediately
                displayUtilityTicketMessage(currentPlayerName, assetTypeSelected, assetSelected, owner);
            } else {
                // Asset not owned or owned by current player - enable Buy
                utilityBuyBtn.style.display = 'inline-block';
                utilityPayTicketBtn.style.display = 'none';
                utilityTicketMessage.textContent = ''; // Clear ticket message
                updateUtilityBuyButtonState();

                // Display purchase amount if all fields are filled
                if (currentPlayerName && assetTypeSelected && assetSelected) {
                    await displayUtilityPurchaseMessage(currentPlayerName, assetTypeSelected, assetSelected);
                }
            }
        } else {
            updateUtilityBuyButtonState();
        }
    } else {
        updateUtilityBuyButtonState();
    }
}

/**
 * Update utility buy button state
 */
function updateUtilityBuyButtonState() {
    const playerSelected = utilityPlayerSelect.value && utilityPlayerSelect.value !== '__new_player__';
    const newPlayerFilled = utilityPlayerSelect.value === '__new_player__' && utilityPlayerInput.value.trim();
    const playerOk = playerSelected || newPlayerFilled;

    const assetTypeSelected = assetTypeSelect.value;
    const assetSelected = commercialAssetSelect.value;

    if (playerOk && assetTypeSelected && assetSelected) {
        utilityBuyBtn.disabled = false;
    } else {
        utilityBuyBtn.disabled = true;
    }
}

/**
 * Display ticket message for a utility/commercial asset
 */
async function displayUtilityTicketMessage(playerName, assetType, assetName, owner) {
    if (assetType === 'Transport') {
        // Calculate and display actual ticket amount for transport
        const ticketAmount = await calculateTransportTicket(owner, assetName);

        if (ticketAmount === null) {
            utilityTicketMessage.textContent = 'Could not calculate ticket amount';
            return;
        }

        // Count how many transport companies the owner has
        let transportCount = 0;
        if (currentPlayerDb[owner] && currentPlayerDb[owner]['Transport']) {
            transportCount = Object.keys(currentPlayerDb[owner]['Transport']).length;
        }

        const ticketMsg = `Player "${playerName}" to pay $${ticketAmount} as ticket to "${owner}" (${transportCount} transport cos)`;
        utilityTicketMessage.textContent = ticketMsg;
        utilityTicketMessage.style.color = '#d32f2f'; // Red color for payment messages
    } else {
        // For utilities, use a simplified ticket message (dummy)
        const ticketMsg = `Player "${playerName}" must pay rent/ticket to "${owner}" for "${assetName}" (${assetType})`;
        utilityTicketMessage.textContent = ticketMsg;
    }
}

/**
 * Calculate purchase price for a commercial asset
 */
async function calculateCommercialAssetPrice(assetType, assetName) {
    try {
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const commercialDb = data.commercial_database || {};

        if (commercialDb[assetType] && commercialDb[assetType][assetName]) {
            return commercialDb[assetType][assetName].price || 0;
        }
        return null;
    } catch (error) {
        console.error('Error calculating commercial asset price:', error);
        return null;
    }
}

/**
 * Display purchase amount preview message for commercial assets
 */
async function displayUtilityPurchaseMessage(playerName, assetType, assetName) {
    const purchasePrice = await calculateCommercialAssetPrice(assetType, assetName);

    if (purchasePrice === null) {
        utilityTicketMessage.textContent = 'Could not calculate purchase price';
        return;
    }

    // Display purchase message inline
    const purchaseMsg = `Player "${playerName}" to pay $${purchasePrice} to Treasurer for "${assetName}" (${assetType})`;
    utilityTicketMessage.textContent = purchaseMsg;
    utilityTicketMessage.style.color = '#d32f2f'; // Red color for payment messages
}

/**
 * Calculate transport ticket amount based on number of transport companies owned
 */
async function calculateTransportTicket(ownerName, assetName) {
    try {
        // Count how many transport companies the owner has
        let transportCount = 0;
        if (currentPlayerDb[ownerName] && currentPlayerDb[ownerName]['Transport']) {
            transportCount = Object.keys(currentPlayerDb[ownerName]['Transport']).length;
        }

        // Get commercial database for ticket pricing
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const commercialDb = data.commercial_database || {};

        if (commercialDb['Transport'] && commercialDb['Transport'][assetName]) {
            const ticketInfo = commercialDb['Transport'][assetName].ticket || {};

            // Map number of transport companies owned to ticket key
            const ticketKeys = {
                1: '1 owned',
                2: '2 owned',
                3: '3 owned',
                4: '4 owned'
            };

            const ticketKey = ticketKeys[transportCount] || '1 owned';
            return ticketInfo[ticketKey] || 0;
        }
        return null;
    } catch (error) {
        console.error('Error calculating transport ticket:', error);
        return null;
    }
}

/**
 * Handle utility pay ticket button click
 */
async function handleUtilityPayTicket() {
    // Extract information from current selections
    const payingPlayer = utilityPlayerSelect.value === '__new_player__'
        ? utilityPlayerInput.value.trim()
        : utilityPlayerSelect.value;
    const assetTypeSelected = assetTypeSelect.value;
    const assetSelected = commercialAssetSelect.value;

    if (!payingPlayer || !assetTypeSelected || !assetSelected) {
        showErrorDetails('Missing player, asset type, or asset information');
        return;
    }

    // Find the owner of the asset
    const owner = findCommercialAssetOwner(assetTypeSelected, assetSelected);

    if (!owner) {
        showErrorDetails('Could not determine asset owner');
        return;
    }

    // Check if this is Transport or Utilities
    if (assetTypeSelected === 'Transport') {
        // Calculate ticket amount for transport companies
        const ticketAmount = await calculateTransportTicket(owner, assetSelected);

        if (ticketAmount === null) {
            showErrorDetails('Could not calculate ticket amount');
            return;
        }

        // Disable button during request
        utilityPayTicketBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/pay-rent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paying_player: payingPlayer,
                    receiving_player: owner,
                    rent_amount: ticketAmount
                }),
            });

            const result = await response.json();

            if (result.error) {
                showErrorDetails(result.error);
            } else if (result.message) {
                // Display the transaction message
                utilityTicketMessage.textContent = result.message;
                utilityTicketMessage.style.color = '#2e7d32'; // Green color for success

                // Refresh database and players, then reset form
                setTimeout(async () => {
                    await loadDatabase();
                    await loadPlayers();
                    resetUtilityForm();
                }, 1500);
            }
        } catch (error) {
            showErrorDetails(`Network error: ${error.message}`);
        } finally {
            // Re-enable button
            utilityPayTicketBtn.disabled = false;
        }
    } else {
        // Utilities remain as dummy for now
        const message = `[DUMMY] Player "${payingPlayer}" would pay rent/ticket to "${owner}" for "${assetSelected}" (${assetTypeSelected})`;
        utilityTicketMessage.textContent = message;
        showMessage('info', message);

        console.log('Pay Ticket (Dummy - Utilities):', {
            payingPlayer,
            owner,
            assetType: assetTypeSelected,
            asset: assetSelected
        });
    }
}

/**
 * Handle utility buy button click
 */
async function handleUtilityBuy() {
    const playerName = utilityPlayerSelect.value === '__new_player__'
        ? utilityPlayerInput.value.trim()
        : utilityPlayerSelect.value;
    const assetType = assetTypeSelect.value;
    const assetName = commercialAssetSelect.value;

    if (!playerName || !assetType || !assetName) {
        showMessage('error', 'Please fill in all fields');
        return;
    }

    // Disable button during request
    utilityBuyBtn.disabled = true;
    utilityBuyBtn.textContent = 'Buying...';

    try {
        const response = await fetch(`${API_BASE}/buy-utility`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName,
                asset_type: assetType,
                asset_name: assetName
            })
        });

        const data = await response.json();

        // Show the message
        if (data.message) {
            showPythonOutput(data.message);
        }

        // Show in error details for errors
        if (data.status === 'error') {
            if (data.message) {
                showErrorDetails(data.message);
            }
        }

        // Update message with payment confirmation
        if (response.ok && data.status !== 'error') {
            // Extract payment info and display confirmation
            const purchasePrice = await calculateCommercialAssetPrice(assetType, assetName);

            if (purchasePrice > 0) {
                utilityTicketMessage.textContent = `Player "${playerName}" paid $${purchasePrice} to Treasurer`;
                utilityTicketMessage.style.color = '#2e7d32'; // Green color for success
            }

            setTimeout(async () => {
                await loadPlayers();
                await loadDatabase();
                resetUtilityForm();
            }, 1500);
        } else {
            utilityBuyBtn.disabled = false;
            utilityBuyBtn.textContent = 'Buy';
        }
    } catch (error) {
        const errorMsg = `Purchase failed: ${error.message}`;
        showErrorDetails(`Network Error:\n${error.message}`);
        utilityBuyBtn.disabled = false;
        utilityBuyBtn.textContent = 'Buy';
    }
}

/**
 * Reset utility action form
 */
function resetUtilityForm() {
    utilityPlayerSelect.value = '';
    utilityPlayerInput.value = '';
    utilityPlayerInput.classList.remove('active');
    assetTypeSelect.value = '';
    assetTypeSelect.disabled = true;
    commercialAssetSelect.value = '';
    commercialAssetSelect.disabled = true;
    selectedAssetType = null;
    if (utilityBuyBtn) {
        utilityBuyBtn.disabled = true;
        utilityBuyBtn.textContent = 'Buy';
        utilityBuyBtn.style.display = 'inline-block';
    }
    if (utilityPayTicketBtn) {
        utilityPayTicketBtn.disabled = true;
        utilityPayTicketBtn.style.display = 'none';
    }
    if (utilityTicketMessage) {
        utilityTicketMessage.textContent = '';
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

    // Utility Action tab event listeners
    if (utilityPlayerSelect) {
        utilityPlayerSelect.addEventListener('change', handleUtilityPlayerChange);
    }
    if (utilityPlayerInput) {
        utilityPlayerInput.addEventListener('input', handleUtilityPlayerInputChange);
    }
    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', handleAssetTypeChange);
    }
    if (commercialAssetSelect) {
        commercialAssetSelect.addEventListener('change', handleCommercialAssetChange);
    }
    if (utilityBuyBtn) {
        utilityBuyBtn.addEventListener('click', handleUtilityBuy);
    }
    if (utilityResetBtn) {
        utilityResetBtn.addEventListener('click', resetUtilityForm);
    }
    if (utilityPayTicketBtn) {
        utilityPayTicketBtn.addEventListener('click', handleUtilityPayTicket);
    }
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
