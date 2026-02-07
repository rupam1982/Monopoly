//
//  ContentView.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var dataManager = DataManager()
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            PropertyActionView(dataManager: dataManager)
                .tabItem {
                    Label("Property Action", systemImage: "house.fill")
                }
                .tag(0)

            UtilityActionView(dataManager: dataManager)
                .tabItem {
                    Label("Utility Action", systemImage: "building.2.fill")
                }
                .tag(1)

            TreasuryActionView(dataManager: dataManager)
                .tabItem {
                    Label("Treasury Action", systemImage: "dollarsign.circle.fill")
                }
                .tag(2)

            AccountsView(dataManager: dataManager)
                .tabItem {
                    Label("Accounts", systemImage: "list.bullet.rectangle")
                }
                .tag(3)
        }
        .frame(minWidth: 800, minHeight: 600)
    }
}

#Preview {
    ContentView()
}
