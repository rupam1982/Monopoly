/**
 * Monopoly Accounts Page - Frontend Logic
 * Handles display of player accounts and transactions
 */

const API_BASE = '/api';

// DOM Elements
let playerDbContent, refreshBtn, backToBoardBtn;

// Store current filter state to preserve during auto-refresh
let currentFilters = {
    player: '',
    street: ''
};

/**
 * Initialize the accounts page
 */
async function init() {
    // Initialize DOM elements
    playerDbContent = document.getElementById('player-db-content');
    refreshBtn = document.getElementById('refresh-btn');
    backToBoardBtn = document.getElementById('back-to-board-btn');

    await loadDatabase();
    setupEventListeners();
    setupTabSwitching();

    // Auto-refresh every 5 seconds
    setInterval(loadDatabase, 5000);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    refreshBtn.addEventListener('click', loadDatabase);
    backToBoardBtn.addEventListener('click', handleBackToBoard);
}

/**
 * Handle back to board button click
 */
function handleBackToBoard() {
    // Check if we're in the macOS app (has webkit messageHandlers)
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.boardMove) {
        // Send message to Swift app to navigate back
        window.webkit.messageHandlers.boardMove.postMessage('show');
    } else {
        // Fallback: Navigate in browser
        window.location.href = '/';
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
 * Load and display player database
 */
async function loadDatabase() {
    try {
        const response = await fetch(`${API_BASE}/database`);
        const data = await response.json();
        const playerDb = data.player_database || {};

        if (Object.keys(playerDb).length === 0) {
            playerDbContent.innerHTML = '<p class="empty">No players or properties assigned yet.</p>';
            document.getElementById('transactions-content').innerHTML = '<p class="empty">No transactions yet.</p>';
        } else {
            displayAssetsTable(playerDb);
            displayTransactionsTable(data);
        }
    } catch (error) {
        console.error('Failed to load database:', error);
        playerDbContent.innerHTML = '<p class="error">Failed to load database</p>';
    }
}

/**
 * Display assets table
 */
function displayAssetsTable(playerDb) {
    // Save current filter selections before rebuilding
    const existingPlayerFilter = document.getElementById('filter-player');
    const existingStreetFilter = document.getElementById('filter-street');
    if (existingPlayerFilter) currentFilters.player = existingPlayerFilter.value;
    if (existingStreetFilter) currentFilters.street = existingStreetFilter.value;

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
                const houses = playerDb[player][street][asset].houses !== undefined
                    ? playerDb[player][street][asset].houses
                    : '-';
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

    // Restore previous filter selections
    const playerFilter = document.getElementById('filter-player');
    const streetFilter = document.getElementById('filter-street');
    if (playerFilter && currentFilters.player) {
        playerFilter.value = currentFilters.player;
    }
    if (streetFilter && currentFilters.street) {
        streetFilter.value = currentFilters.street;
    }

    setupTableFilters(playerDb);

    // Re-apply filters if they were set
    if (currentFilters.player || currentFilters.street) {
        // Update street options based on player selection
        if (currentFilters.player) {
            updateStreetFilterOptions(currentFilters.player, playerDb);
            // Restore street filter value after update
            const updatedStreetFilter = document.getElementById('filter-street');
            if (updatedStreetFilter && currentFilters.street) {
                updatedStreetFilter.value = currentFilters.street;
            }
        }
        // Apply the filters
        filterTable({
            player: playerFilter,
            street: document.getElementById('filter-street')
        });
    }
}

/**
 * Display transactions table
 */
function displayTransactionsTable(data) {
    const playerAccounts = data.player_accounts || {};
    const transactionsContent = document.getElementById('transactions-content');

    if (Object.keys(playerAccounts).length === 0) {
        transactionsContent.innerHTML = '<p class="empty">No transactions yet.</p>';
        return;
    }

    // Save current filter selection before rebuilding
    const existingTransactionPlayerFilter = document.getElementById('filter-transaction-player');
    const previousTransactionFilter = existingTransactionPlayerFilter ? existingTransactionPlayerFilter.value : '';

    // Collect unique players
    const uniquePlayers = Object.keys(playerAccounts).sort();
    const playerOptions = uniquePlayers.map(p =>
        `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`
    ).join('');

    let tableHTML = `
        <table class="db-table" id="transactions-table">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Amount</th>
                    <th>Source/Destination</th>
                    <th>Balance</th>
                </tr>
                <tr class="filter-row">
                    <th>
                        <select class="table-filter" id="filter-transaction-player">
                            <option value="">All Players</option>
                            ${playerOptions}
                        </select>
                    </th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="transactions-table-body">
    `;

    for (const player in playerAccounts) {
        const transactions = playerAccounts[player];
        let balance = 0;

        transactions.forEach(transaction => {
            const amount = transaction['payment amount'];
            const source = transaction['payment source'];
            balance += amount;

            const amountClass = amount >= 0 ? 'positive' : 'negative';
            const amountSign = amount >= 0 ? '+' : '';

            tableHTML += `
                <tr>
                    <td>${escapeHtml(player)}</td>
                    <td class="${amountClass}">${amountSign}$${amount}</td>
                    <td>${escapeHtml(source)}</td>
                    <td>$${balance}</td>
                </tr>
            `;
        });
    }

    tableHTML += `
            </tbody>
        </table>
    `;

    transactionsContent.innerHTML = tableHTML;

    // Restore previous filter selection
    const transactionPlayerFilter = document.getElementById('filter-transaction-player');
    if (transactionPlayerFilter && previousTransactionFilter) {
        transactionPlayerFilter.value = previousTransactionFilter;
    }

    setupTransactionFilters();

    // Re-apply filter if it was set
    if (previousTransactionFilter) {
        filterTransactionsTable(transactionPlayerFilter);
    }
}

/**
 * Setup table filter functionality
 */
function setupTableFilters(playerDb) {
    const playerFilter = document.getElementById('filter-player');
    const streetFilter = document.getElementById('filter-street');

    // Add event listener to player filter to update street options
    if (playerFilter) {
        playerFilter.addEventListener('change', () => {
            currentFilters.player = playerFilter.value;
            currentFilters.street = ''; // Reset street filter when player changes
            updateStreetFilterOptions(playerFilter.value, playerDb);
            // Re-attach listener to street filter after it's been recreated
            attachStreetFilterListener(playerDb);
            // Filter with current values
            filterTable({
                player: playerFilter,
                street: document.getElementById('filter-street')
            });
        });
    }

    // Initial attachment of street filter listener
    attachStreetFilterListener(playerDb);
}

/**
 * Attach event listener to street filter
 */
function attachStreetFilterListener(playerDb) {
    const playerFilter = document.getElementById('filter-player');
    const streetFilter = document.getElementById('filter-street');

    if (streetFilter) {
        // Remove old listener by cloning and replacing the node
        const newStreetFilter = streetFilter.cloneNode(true);
        streetFilter.parentNode.replaceChild(newStreetFilter, streetFilter);

        // Add new listener
        newStreetFilter.addEventListener('change', () => {
            currentFilters.street = newStreetFilter.value;
            filterTable({
                player: playerFilter,
                street: newStreetFilter
            });
        });
    }
}

/**
 * Update street filter options based on selected player
 */
function updateStreetFilterOptions(selectedPlayer, playerDb) {
    const streetFilter = document.getElementById('filter-street');
    if (!streetFilter) return;

    if (!selectedPlayer) {
        // Show all streets
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
        // Show only streets for selected player
        const playerStreets = playerDb[selectedPlayer] ? Object.keys(playerDb[selectedPlayer]) : [];
        const streetOptions = playerStreets.sort().map(s =>
            `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
        ).join('');
        streetFilter.innerHTML = `<option value="">All Streets</option>${streetOptions}`;
    }
}

/**
 * Filter table based on selected filters
 */
function filterTable(filters) {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');

    for (const row of rows) {
        const cells = row.getElementsByTagName('td');
        if (cells.length < 2) continue;

        const playerText = cells[0].textContent;
        const streetText = cells[1].textContent;

        const matchesPlayer = !filters.player.value || playerText === filters.player.value;
        const matchesStreet = !filters.street.value || streetText === filters.street.value;

        if (matchesPlayer && matchesStreet) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Setup transaction table filter functionality
 */
function setupTransactionFilters() {
    const transactionPlayerFilter = document.getElementById('filter-transaction-player');

    if (transactionPlayerFilter) {
        transactionPlayerFilter.addEventListener('change', () => {
            filterTransactionsTable(transactionPlayerFilter);
        });
    }
}

/**
 * Filter transactions table based on selected player
 */
function filterTransactionsTable(playerFilter) {
    const tableBody = document.getElementById('transactions-table-body');
    if (!tableBody) return;

    const rows = tableBody.getElementsByTagName('tr');
    const selectedPlayer = playerFilter.value;

    for (const row of rows) {
        const cells = row.getElementsByTagName('td');
        if (cells.length < 1) continue;

        const playerText = cells[0].textContent;

        if (!selectedPlayer || playerText === selectedPlayer) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
