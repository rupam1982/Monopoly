//
//  TreasuryActionView.swift
//  Monopoly
//

import SwiftUI

enum TransactionType {
    case pay
    case collect
}

struct TreasuryActionView: View {
    @ObservedObject var dataManager: DataManager
    @State private var selectedPlayer = ""
    @State private var amount = ""
    @State private var transactionType: TransactionType = .pay
    @State private var message = ""
    @State private var messageColor = Color.green

    var allPlayers: [String] {
        Array(dataManager.playerDatabase.keys.sorted())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Treasury Action")
                .font(.title)
                .bold()
                .padding(.bottom, 10)

            // Player selection
            VStack(alignment: .leading, spacing: 8) {
                Text("Player")
                    .font(.headline)
                Picker("Select Player", selection: $selectedPlayer) {
                    Text("-- Select Player --").tag("")
                    ForEach(allPlayers, id: \.self) { player in
                        Text(player).tag(player)
                    }
                }
                .frame(maxWidth: 300)
            }

            // Transaction Type
            VStack(alignment: .leading, spacing: 8) {
                Text("Transaction Type")
                    .font(.headline)
                Picker("Type", selection: $transactionType) {
                    Text("Pay Treasurer").tag(TransactionType.pay)
                    Text("Collect from Treasurer").tag(TransactionType.collect)
                }
                .pickerStyle(.radioGroup)
            }

            // Amount
            VStack(alignment: .leading, spacing: 8) {
                Text("Amount ($)")
                    .font(.headline)
                TextField("Enter amount", text: $amount)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 300)
            }

            // Buttons and message - fixed layout
            HStack(spacing: 0) {
                Button("Submit") {
                    submitTransaction()
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canSubmit)
                .frame(width: 100, alignment: .leading)

                Text(message)
                    .foregroundColor(messageColor)
                    .italic()
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.horizontal, 15)
                    .multilineTextAlignment(.center)

                Button("Reset") {
                    resetForm()
                }
                .buttonStyle(.bordered)
                .frame(width: 100, alignment: .trailing)
            }
            .padding(.top, 10)

            Spacer()
        }
        .padding(30)
    }

    var canSubmit: Bool {
        !selectedPlayer.isEmpty && !amount.isEmpty && (Int(amount) ?? 0) > 0
    }

    func submitTransaction() {
        guard let amountValue = Int(amount), amountValue > 0 else {
            message = "Please enter a valid amount"
            messageColor = .red
            return
        }

        let actualAmount = transactionType == .pay ? -amountValue : amountValue

        // Record transaction
        if dataManager.playerAccounts[selectedPlayer] == nil {
            dataManager.playerAccounts[selectedPlayer] = []
        }
        dataManager.playerAccounts[selectedPlayer]?.append(
            Transaction(paymentAmount: actualAmount, paymentSource: "Treasurer")
        )

        let action = transactionType == .pay ? "paid" : "collected"
        let preposition = transactionType == .pay ? "to" : "from"
        message = "Player \"\(selectedPlayer)\" \(action) $\(amountValue) \(preposition) Treasurer"
        messageColor = .green

        // Reset after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            resetForm()
        }
    }

    func resetForm() {
        selectedPlayer = ""
        amount = ""
        transactionType = .pay
        message = ""
    }
}
