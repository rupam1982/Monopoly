import Combine
import Foundation

// MARK: - Asset Database Structures

struct Asset: Codable {
    let landPrice: Int
    let housePrice: Int
    let rent: Rent

    enum CodingKeys: String, CodingKey {
        case landPrice = "land_price"
        case housePrice = "house_price"
        case rent
    }
}

struct Rent: Codable {
    let noHouses: Int
    let oneHouse: Int
    let twoHouses: Int
    let threeHouses: Int
    let fourHouses: Int

    enum CodingKeys: String, CodingKey {
        case noHouses = "no_houses"
        case oneHouse = "one_house"
        case twoHouses = "two_houses"
        case threeHouses = "three_houses"
        case fourHouses = "four_houses"
    }
}

typealias AssetDatabase = [String: [String: Asset]]

// MARK: - Player Database Structures

struct OwnedAsset: Codable {
    var houses: Int
}

typealias PlayerDatabase = [String: [String: [String: OwnedAsset]]]

// MARK: - Player Accounts Structures

struct Transaction: Codable {
    let paymentAmount: Int
    let paymentSource: String

    enum CodingKeys: String, CodingKey {
        case paymentAmount = "payment amount"
        case paymentSource = "payment source"
    }
}

typealias PlayerAccounts = [String: [Transaction]]

// MARK: - Commercial Properties Structures

struct CommercialAssetData: Codable {
    let price: Int?
    let multiplier: [String: Int]?
    let ticket: [String: Int]?
}

typealias CommercialProperties = [String: [String: CommercialAssetData]]

// MARK: - DataManager Class

class DataManager: ObservableObject {
    @Published var assetDatabase: AssetDatabase = [:]
    @Published var playerDatabase: PlayerDatabase = [:]
    @Published var playerAccounts: PlayerAccounts = [:]
    @Published var commercialProperties: CommercialProperties = [:]

    init() {
        loadDatabases()
    }

    private func loadDatabases() {
        assetDatabase = load("Asset_database") ?? [:]
        playerDatabase = load("Player_database") ?? [:]
        playerAccounts = load("Player_accounts") ?? [:]
        commercialProperties = load("Commercial_properties") ?? [:]
    }

    private func load<T: Decodable>(_ filename: String) -> T? {
        guard let fileUrl = Bundle.main.url(forResource: filename, withExtension: "json") else {
            print("WARNING: \(filename).json not found in bundle.")
            return nil
        }

        do {
            let data = try Data(contentsOf: fileUrl)
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            print("ERROR: Failed to load or decode \(filename).json: \(error)")
            return nil
        }
    }

    func validateAssetExists(areaName: String, assetName: String) -> Bool {
        if let area = assetDatabase[areaName], area[assetName] != nil {
            return true
        }
        return false
    }

    enum AssignmentResult {
        case success(message: String)
        case error(message: String)
        case warning(message: String)
    }

    func assignAssetToPlayer(playerName: String, areaName: String, assetName: String, houses: Int)
        -> AssignmentResult
    {
        guard houses >= 0 else {
            return .error(message: "Houses must be a non-negative number.")
        }

        if !validateAssetExists(areaName: areaName, assetName: assetName) {
            return .error(
                message: "ERROR: Asset '\(assetName)' does not exist under area '\(areaName)'.")
        }

        // Check if asset is owned by another player
        for (otherPlayer, areas) in playerDatabase where otherPlayer != playerName {
            if areas[areaName]?[assetName] != nil {
                return .error(
                    message:
                        "ERROR: Asset '\(assetName)' is already assigned to player '\(otherPlayer)'. Assignment to '\(playerName)' DENIED."
                )
            }
        }

        // Ensure player exists in the database
        if playerDatabase[playerName] == nil {
            playerDatabase[playerName] = [:]
        }

        // Ensure area exists for the player
        if playerDatabase[playerName]?[areaName] == nil {
            playerDatabase[playerName]?[areaName] = [:]
        }

        var finalHouses = houses
        var message = ""

        if var existingAsset = playerDatabase[playerName]?[areaName]?[assetName] {
            let newTotal = existingAsset.houses + houses
            if newTotal > 4 {
                message =
                    "WARNING: Adding \(houses) houses to asset '\(assetName)' for player '\(playerName)' would result in \(newTotal) houses, but maximum is 4. Capping at 4."
                existingAsset.houses = 4
            } else {
                message =
                    "INFO: Adding \(houses) houses to asset '\(assetName)' for player '\(playerName)': \(existingAsset.houses) + \(houses) = \(newTotal) houses"
                existingAsset.houses = newTotal
            }
            playerDatabase[playerName]?[areaName]?[assetName] = existingAsset
            return .warning(message: message)
        } else {
            if houses > 4 {
                message =
                    "WARNING: Assigning \(houses) houses to asset '\(assetName)' exceeds maximum of 4. Capping at 4."
                finalHouses = 4
            } else {
                message =
                    "SUCCESS: Asset '\(assetName)' (\(areaName)) assigned to player '\(playerName)' with \(houses) houses"
            }
            playerDatabase[playerName]?[areaName]?[assetName] = OwnedAsset(houses: finalHouses)
            if houses > 4 {
                return .warning(message: message)
            }
            return .success(message: message)
        }
    }

    func processRentPayment(payingPlayer: String, receivingPlayer: String, rentAmount: Int) {
        if playerAccounts[payingPlayer] == nil {
            playerAccounts[payingPlayer] = []
        }
        if playerAccounts[receivingPlayer] == nil {
            playerAccounts[receivingPlayer] = []
        }

        let paymentToReceiver = Transaction(paymentAmount: rentAmount, paymentSource: payingPlayer)
        let paymentFromPayer = Transaction(
            paymentAmount: -rentAmount, paymentSource: receivingPlayer)

        playerAccounts[receivingPlayer]?.append(paymentToReceiver)
        playerAccounts[payingPlayer]?.append(paymentFromPayer)

        print("Player \(payingPlayer) has paid $\(rentAmount) to Player \(receivingPlayer)")
    }

    func startGame(players: [String], startingBalance: Int) {
        // Clear all player data
        playerDatabase = [:]
        playerAccounts = [:]

        // Initialize each player with starting balance
        for player in players {
            playerAccounts[player] = [
                Transaction(paymentAmount: startingBalance, paymentSource: "Game Start")
            ]
        }

        print("Game started with \(players.count) players, each with $\(startingBalance)")
    }

    func resetGame() {
        // Clear all mutable data
        playerDatabase = [:]
        playerAccounts = [:]

        print("Game reset - all player data cleared")
    }
}
