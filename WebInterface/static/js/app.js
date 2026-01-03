/**
 * Monopoly Web Interface - Frontend Logic
 * Handles UI interactions and API communication
 */

const API_BASE = '/api';

// DOM Elements
const playerSelect = document.getElementById('player-select');
const playerInput = document.getElementById('player-input');
const areaSelect = document.getElementById('area-select');
const assetSelect = document.getElementById('asset-select');
const housesSelect = document.getElementById('houses-select');
const assignBtn = document.getElementById('assign-btn');
const resetBtn = document.getElementById('reset-btn');
const refreshBtn = document.getElementById('refresh-btn');
const messageArea = document.getElementById('message-area');
const messageContent = document.getElementById('message-content');
const playerDbContent = document.getElementById('player-db-content');

// State
let availableAreas = [];
let assetsByArea = {};
let selectedArea = null;

/**
 * Initialize the application
 */
async function init() {
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

        // Determine message type
        let messageType = 'success';
        if (data.status === 'error') {
            messageType = 'error';
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
        showMessage('error', `Assignment failed: ${error.message}`);
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
            playerDbContent.innerHTML = `<pre>${JSON.stringify(playerDb, null, 2)}</pre>`;
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
    resetBtn.addEventListener('click', resetForm);
    refreshBtn.addEventListener('click', loadDatabase);

    // Allow Enter key to submit
    housesSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !assignBtn.disabled) {
            handleAssign();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
