//
//  AccountsView.swift
//  Monopoly
//

import SwiftUI

struct AccountsView: View {
    @ObservedObject var dataManager: DataManager
    @State private var selectedTab = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Player Accounts & Transactions")
                .font(.title)
                .bold()
                .padding(.bottom, 10)

            Picker("View", selection: $selectedTab) {
                Text("Properties").tag(0)
                Text("Transactions").tag(1)
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 300)

            if selectedTab == 0 {
                PropertiesListView(dataManager: dataManager)
            } else {
                TransactionsListView(dataManager: dataManager)
            }

            Spacer()
        }
        .padding(30)
    }
}

struct PropertiesListView: View {
    @ObservedObject var dataManager: DataManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 15) {
                if dataManager.playerDatabase.isEmpty {
                    Text("No players or properties yet")
                        .foregroundColor(.secondary)
                        .padding()
                } else {
                    ForEach(dataManager.playerDatabase.keys.sorted(), id: \.self) { player in
                        PlayerPropertiesCard(player: player, dataManager: dataManager)
                    }
                }
            }
        }
    }
}

struct PlayerPropertiesCard: View {
    let player: String
    @ObservedObject var dataManager: DataManager

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(player)
                .font(.headline)
                .padding(.bottom, 5)

            if let areas = dataManager.playerDatabase[player] {
                ForEach(areas.keys.sorted(), id: \.self) { area in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(area)
                            .font(.subheadline)
                            .bold()

                        if let assets = areas[area] {
                            ForEach(assets.keys.sorted(), id: \.self) { asset in
                                if let ownership = assets[asset] {
                                    HStack {
                                        Text("• \(asset)")
                                        Spacer()
                                        Text("\(ownership.houses) houses")
                                            .foregroundColor(.secondary)
                                    }
                                    .font(.caption)
                                }
                            }
                        }
                    }
                    .padding(.leading, 10)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

struct TransactionsListView: View {
    @ObservedObject var dataManager: DataManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 15) {
                if dataManager.playerAccounts.isEmpty {
                    Text("No transactions yet")
                        .foregroundColor(.secondary)
                        .padding()
                } else {
                    ForEach(dataManager.playerAccounts.keys.sorted(), id: \.self) { player in
                        PlayerTransactionsCard(player: player, dataManager: dataManager)
                    }
                }
            }
        }
    }
}

struct PlayerTransactionsCard: View {
    let player: String
    @ObservedObject var dataManager: DataManager

    var totalBalance: Int {
        dataManager.playerAccounts[player]?.reduce(0) { $0 + $1.paymentAmount } ?? 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(player)
                    .font(.headline)
                Spacer()
                Text("Balance: $\(totalBalance)")
                    .font(.subheadline)
                    .bold()
                    .foregroundColor(totalBalance >= 0 ? .green : .red)
            }
            .padding(.bottom, 5)

            if let transactions = dataManager.playerAccounts[player] {
                ForEach(transactions.indices, id: \.self) { index in
                    let transaction = transactions[index]
                    HStack {
                        Text(transaction.paymentSource)
                            .font(.caption)
                        Spacer()
                        Text(
                            transaction.paymentAmount >= 0
                                ? "+$\(transaction.paymentAmount)"
                                : "-$\(abs(transaction.paymentAmount))"
                        )
                        .font(.caption)
                        .foregroundColor(transaction.paymentAmount >= 0 ? .green : .red)
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}
