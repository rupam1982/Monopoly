//
//  MonopolyApp.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//

import SwiftUI
import CoreData

@main
struct MonopolyApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
