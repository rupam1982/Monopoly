//
//  UtilityActionView.swift
//  Monopoly
//

import SwiftUI

struct UtilityActionView: View {
    @ObservedObject var dataManager: DataManager
    @State private var selectedPlayer = ""
    @State private var newPlayerName = ""
    @State private var selectedAssetType = ""
    @State private var selectedAsset = ""
    @State private var message = ""
    @State private var messageColor = Color.green
    @State private var showingNewPlayer = false

    var allPlayers: [String] {
        Array(dataManager.playerDatabase.keys.sorted())
    }

    var assetTypes: [String] {
        Array(dataManager.commercialProperties.keys.sorted())
    }

    var commercialAssets: [String] {
        guard !selectedAssetType.isEmpty else { return [] }
        return Array(dataManager.commercialProperties[selectedAssetType]?.keys.sorted() ?? [])
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Utility Action")
                .font(.title)
                .bold()
                .padding(.bottom, 10)

            // Player selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Player")
                    .font(.headline)

                HStack {
                    if showingNewPlayer {
                        TextField("Enter new player name", text: $newPlayerName)
                            .textFieldStyle(.roundedBorder)
                        Button("Cancel") {
                            showingNewPlayer = false
                            newPlayerName = ""
                        }
                        .buttonStyle(.bordered)
                    } else {
                        Picker("Select Player", selection: $selectedPlayer) {
                            Text("-- Select Player --").tag("")
                            ForEach(allPlayers, id: \.self) { player in
                                Text(player).tag(player)
                            }
                        }
                        .frame(maxWidth: 300)

                        Button("New Player") {
                            showingNewPlayer = true
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }

            // Asset Type selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Asset Type")
                    .font(.headline)
                Picker("Select Asset Type", selection: $selectedAssetType) {
                    Text("-- Select Type --").tag("")
                    ForEach(assetTypes, id: \.self) { type in
                        Text(type).tag(type)
                    }
                }
                .frame(maxWidth: 300)
                .disabled(currentPlayerName.isEmpty)
            }

            // Commercial Asset selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Property")
                    .font(.headline)
                Picker("Select Property", selection: $selectedAsset) {
                    Text("-- Select Property --").tag("")
                    ForEach(commercialAssets, id: \.self) { asset in
                        Text(asset).tag(asset)
                    }
                }
                .frame(maxWidth: 300)
                .disabled(selectedAssetType.isEmpty)
            }

            // Buttons and message
            HStack(spacing: 15) {
                Button("Buy") {
                    buyUtility()
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canBuy)

                Text(message)
                    .foregroundColor(messageColor)
                    .italic()
                    .frame(maxWidth: .infinity, alignment: .leading)

                Button("Reset") {
                    resetForm()
                }
                .buttonStyle(.bordered)
            }
            .padding(.top, 10)

            Spacer()
        }
        .padding(30)
    }

    var currentPlayerName: String {
        showingNewPlayer ? newPlayerName : selectedPlayer
    }

    var canBuy: Bool {
        !currentPlayerName.isEmpty && !selectedAssetType.isEmpty && !selectedAsset.isEmpty
    }

    func buyUtility() {
        let playerName = currentPlayerName

        // Get the price from commercial properties
        if let assetData = dataManager.commercialProperties[selectedAssetType]?[selectedAsset],
            let price = assetData.price
        {

            message = "Player \"\(playerName)\" paid $\(price) to Treasurer"
            messageColor = .green

            // Record transaction
            if dataManager.playerAccounts[playerName] == nil {
                dataManager.playerAccounts[playerName] = []
            }
            dataManager.playerAccounts[playerName]?.append(
                Transaction(paymentAmount: -price, paymentSource: "Treasurer")
            )

            // Reset form after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                if showingNewPlayer {
                    showingNewPlayer = false
                    newPlayerName = ""
                }
                resetForm()
            }
        } else {
            message = "ERROR: Could not find price for this asset"
            messageColor = .red
        }
    }

    func resetForm() {
        selectedPlayer = ""
        selectedAssetType = ""
        selectedAsset = ""
        message = ""
    }
}
