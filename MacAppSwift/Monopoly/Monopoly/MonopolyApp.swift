//
//  MonopolyApp.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//

import SwiftUI

@main
struct MonopolyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .appInfo) {
                Button("About Monopoly") {
                    NSApplication.shared.orderFrontStandardAboutPanel(
                        options: [
                            NSApplication.AboutPanelOptionKey.credits: NSAttributedString(
                                string: "Monopoly Property Management System",
                                attributes: [
                                    NSAttributedString.Key.font: NSFont.boldSystemFont(ofSize: 12)
                                ]
                            ),
                            NSApplication.AboutPanelOptionKey(rawValue: "Copyright"):
                                "© 2026 Rupam Mukherjee",
                        ]
                    )
                }
            }
        }
    }
}
