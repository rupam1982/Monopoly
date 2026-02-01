//
//  MonopolyApp.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//  iOS Version
//

import SwiftUI
import Combine

@main
struct MonopolyApp: App {
    @StateObject private var serverManager = FlaskServerManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(serverManager)
                .onAppear {
                    serverManager.checkServerStatus()
                }
        }
    }
}

class FlaskServerManager: ObservableObject {
    @Published var serverStatus: String = "Checking..."
    @Published var serverURL: String = "http://127.0.0.1:5001"
    @Published var isConnected: Bool = false
    
    func checkServerStatus() {
        print("Checking Flask server connection...")
        serverStatus = "Note: Flask server must run on a Mac or external server"
        
        // iOS apps cannot run Python servers directly
        // The Flask server needs to run on a Mac or external server
        // and the iOS app will connect to it via the network
        
        testConnection()
    }
    
    func testConnection() {
        guard let url = URL(string: serverURL) else {
            serverStatus = "Invalid server URL"
            return
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 5
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    self?.isConnected = true
                    self?.serverStatus = "Connected to server"
                } else {
                    self?.isConnected = false
                    self?.serverStatus = "Cannot connect to server. Make sure Flask is running on \(self?.serverURL ?? "")"
                }
            }
        }.resume()
    }
}
