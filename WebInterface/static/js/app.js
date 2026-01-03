/**
 * Monopoly Web Interface - Frontend Logic
 * Handles UI interactions and API communication
 */

const API_BASE = '/api';

// DOM Elements - will be initialized after DOM loads
let playerSelect, playerInput, areaSelect, assetSelect, housesSelect;
let assignBtn, resetBtn, refreshBtn;
let messageArea, messageContent, playerDbContent;
let errorDetailsBox, errorDetailsContent, closeErrorBox;
let pythonOutputBox, pythonOutputContent, closeOutputBox;

// State
let availableAreas = [];
let assetsByArea = {};
let selectedArea = null;

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
    resetBtn = document.getElementById('reset-btn');
    refreshBtn = document.getElementById('refresh-btn');
    messageArea = document.getElementById('message-area');
    messageContent = document.getElementById('message-content');
    playerDbContent = document.getElementById('player-db-content');
    errorDetailsBox = document.getElementById('error-details-box');
    errorDetailsContent = document.getElementById('error-details-content');
    closeErrorBox = document.getElementById('close-error-box');
    pythonOutputBox = document.getElementById('python-output-box');
    pythonOutputContent = document.getElementById('python-output-content');
    closeOutputBox = document.getElementById('close-output-box');

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
 * Check if all required fields are filled and enable/disable assign button
 */
function updateAssignButtonState() {
    const playerSelected = playerSelect.value && playerSelect.value !== '__new_player__';
    const newPlayerFilled = playerSelect.value === '__new_player__' && playerInput.value.trim();
    const playerOk = playerSelected || newPlayerFilled;

    const areaSelected = areaSelect.value;
    const assetSelected = assetSelect.value;
    const housesSelected = housesSelect.value !== '';

    const allFieldsFilled = playerOk && areaSelected && assetSelected && housesSelected;
    assignBtn.disabled = !allFieldsFilled;
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
        housesSelect.disabled = false;
    } else {
        housesSelect.disabled = true;
        housesSelect.value = '';
    }

    updateAssignButtonState();
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
        showMessage('error', 'Please fill in all fields');
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

        // Determine message type
        let messageType = 'success';
        if (data.status === 'error') {
            messageType = 'error';
            // Also show in error details for errors
            if (data.message) {
                showErrorDetails(data.message);
            }
        } else if (data.status === 'warning') {
            messageType = 'warning';
        }

        showMessage(messageType, data.message);

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
        showMessage('error', errorMsg);
        showErrorDetails(`Network Error:\n${error.message}\n\nStack Trace:\n${error.stack || 'Not available'}`);
        updateAssignButtonState();
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
            // Build table
            let tableHTML = `
                <table class="db-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Street</th>
                            <th>Asset Name</th>
                            <th>No of Houses</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            // Iterate through players, streets, and assets
            for (const player in playerDb) {
                for (const street in playerDb[player]) {
                    for (const asset in playerDb[player][street]) {
                        const houses = playerDb[player][street][asset].houses || 0;
                        tableHTML += `
                            <tr>
                                <td>${escapeHtml(player)}</td>
                                <td>${escapeHtml(street)}</td>
                                <td>${escapeHtml(asset)}</td>
                                <td>${houses}</td>
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
        }
    } catch (error) {
        playerDbContent.innerHTML = `<p class="error">Failed to load database: ${error.message}</p>`;
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
    resetBtn.addEventListener('click', () => {
        resetForm();
        hideErrorDetails(); // Hide error box when user clicks reset
        hidePythonOutput(); // Hide output box when user clicks reset
    });
    refreshBtn.addEventListener('click', loadDatabase);
    closeErrorBox.addEventListener('click', hideErrorDetails);
    closeOutputBox.addEventListener('click', hidePythonOutput);

    // Allow Enter key to submit
    housesSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !assignBtn.disabled) {
            handleAssign();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
