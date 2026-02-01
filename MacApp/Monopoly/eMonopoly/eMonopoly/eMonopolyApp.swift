//
//  eMonopolyApp.swift
//  eMonopoly
//
//  Created by Rupam Mukherjee on 31/01/26.
//

import SwiftUI
import CoreData

@main
struct eMonopolyApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
