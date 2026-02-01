//
//  ContentView.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//  iOS Version - Web Interface with Settings
//

import SwiftUI
import WebKit

struct ContentView: View {
    @EnvironmentObject var serverManager: FlaskServerManager
    @State private var showSettings = false
    
    var body: some View {
        NavigationView {
            VStack {
                if serverManager.isConnected {
                    WebView(url: URL(string: serverManager.serverURL)!)
                } else {
                    VStack(spacing: 20) {
                        Image(systemName: "network.slash")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("Not Connected")
                            .font(.title)
                        
                        Text(serverManager.serverStatus)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)
                            .padding()
                        
                        Button("Retry Connection") {
                            serverManager.testConnection()
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Settings") {
                            showSettings = true
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                }
            }
            .navigationTitle("Monopoly")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .environmentObject(serverManager)
            }
        }
    }
}

struct WebView: UIViewRepresentable {
    let url: URL
    
    func makeUIView(context: Context) -> WKWebView {
        WKWebView()
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url))
    }
}

struct SettingsView: View {
    @EnvironmentObject var serverManager: FlaskServerManager
    @Environment(\.dismiss) var dismiss
    @State private var serverURL: String = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("Server Settings") {
                    TextField("Server URL", text: $serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    
                    Text("Example: http://192.168.1.100:5001")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section {
                    Button("Save & Test Connection") {
                        serverManager.serverURL = serverURL
                        serverManager.testConnection()
                        dismiss()
                    }
                    .disabled(serverURL.isEmpty)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                serverURL = serverManager.serverURL
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(FlaskServerManager())
}
