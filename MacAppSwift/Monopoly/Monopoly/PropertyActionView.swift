//
//  PropertyActionView.swift
//  Monopoly
//

import SwiftUI

struct PropertyActionView: View {
    @ObservedObject var dataManager: DataManager
    @State private var selectedPlayer = ""
    @State private var newPlayerName = ""
    @State private var selectedArea = ""
    @State private var selectedAsset = ""
    @State private var houses = 1
    @State private var message = ""
    @State private var messageColor = Color.green
    @State private var showingNewPlayer = false

    var allPlayers: [String] {
        Array(dataManager.playerDatabase.keys.sorted())
    }

    var availableAreas: [String] {
        Array(dataManager.assetDatabase.keys.sorted())
    }

    var availableAssets: [String] {
        guard !selectedArea.isEmpty else { return [] }
        return Array(dataManager.assetDatabase[selectedArea]?.keys.sorted() ?? [])
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Property Action")
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

            // Area selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Area")
                    .font(.headline)
                Picker("Select Area", selection: $selectedArea) {
                    Text("-- Select Area --").tag("")
                    ForEach(availableAreas, id: \.self) { area in
                        Text(area).tag(area)
                    }
                }
                .frame(maxWidth: 300)
                .disabled(currentPlayerName.isEmpty)
            }

            // Asset selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Property")
                    .font(.headline)
                Picker("Select Property", selection: $selectedAsset) {
                    Text("-- Select Property --").tag("")
                    ForEach(availableAssets, id: \.self) { asset in
                        Text(asset).tag(asset)
                    }
                }
                .frame(maxWidth: 300)
                .disabled(selectedArea.isEmpty)
            }

            // Houses selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Houses")
                    .font(.headline)
                Picker("Houses", selection: $houses) {
                    ForEach(0...4, id: \.self) { num in
                        Text("\(num)").tag(num)
                    }
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 300)
                .disabled(selectedAsset.isEmpty)
            }

            // Buttons and message
            HStack(spacing: 15) {
                Button("Buy Property") {
                    buyProperty()
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canBuyProperty)

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

    var canBuyProperty: Bool {
        !currentPlayerName.isEmpty && !selectedArea.isEmpty && !selectedAsset.isEmpty
    }

    func buyProperty() {
        let playerName = currentPlayerName

        let result = dataManager.assignAssetToPlayer(
            playerName: playerName,
            areaName: selectedArea,
            assetName: selectedAsset,
            houses: houses
        )

        switch result {
        case .success(let msg):
            if let asset = dataManager.assetDatabase[selectedArea]?[selectedAsset] {
                let totalCost = asset.landPrice + (asset.housePrice * houses)
                message = "Player \"\(playerName)\" paid $\(totalCost) to Treasurer"
                messageColor = .green

                // Record transaction
                if dataManager.playerAccounts[playerName] == nil {
                    dataManager.playerAccounts[playerName] = []
                }
                dataManager.playerAccounts[playerName]?.append(
                    Transaction(paymentAmount: -totalCost, paymentSource: "Treasurer")
                )
            } else {
                message = msg
                messageColor = .green
            }

            // Reset form after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                if showingNewPlayer {
                    showingNewPlayer = false
                    newPlayerName = ""
                }
                resetForm()
            }

        case .error(let msg):
            message = msg
            messageColor = .red

        case .warning(let msg):
            message = msg
            messageColor = .orange
        }
    }

    func resetForm() {
        selectedPlayer = ""
        selectedArea = ""
        selectedAsset = ""
        houses = 1
        message = ""
    }
}
