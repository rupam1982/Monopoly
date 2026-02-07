//
//  MonopolyApp.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//

import Cocoa
import WebKit

@main
class MonopolyApp: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var propertyWindow: NSWindow!
    var webView: WKWebView!
    var flaskPort: Int = 5001  // Default port
    var flaskProcess: Process?
    
    static func main() {
        let app = NSApplication.shared
        let delegate = MonopolyApp()
        app.delegate = delegate
        app.setActivationPolicy(.regular)
        app.run()
    }
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launching...")
        
        // Start Flask server
        startFlaskServer()
        
        // Load Flask port from config file
        loadFlaskPort()
        
        // Create menu bar
        setupMenuBar()
        
        // Create Property Management window on launch
        createPropertyWindow()
        
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func startFlaskServer() {
        // Get the project directory
        guard let projectPath = getProjectPath() else {
            print("ERROR: Could not find project directory")
            return
        }
        
        let webInterfacePath = projectPath + "/WebInterface"
        let portFilePath = webInterfacePath + "/.flask_port"
        
        // Check if Flask is already running
        let task = Process()
        task.launchPath = "/bin/bash"
        task.arguments = ["-c", "pgrep -f 'python.*run.py'"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = Pipe()
        
        do {
            try task.run()
            task.waitUntilExit()
            
            if task.terminationStatus == 0 {
                print("✓ Flask already running")
                return
            }
        } catch {
            print("Error checking Flask status: \(error)")
        }
        
        // Remove old port config file
        try? FileManager.default.removeItem(atPath: portFilePath)
        
        // Start Flask server
        print("Starting Flask server...")
        flaskProcess = Process()
        flaskProcess?.currentDirectoryPath = webInterfacePath
        
        // Try to find Python in virtual environment
        let venvPython = projectPath + "/.venv/bin/python"
        if FileManager.default.fileExists(atPath: venvPython) {
            flaskProcess?.launchPath = venvPython
        } else {
            flaskProcess?.launchPath = "/usr/bin/python3"
        }
        
        flaskProcess?.arguments = ["run.py"]
        
        // Redirect output to log file
        let logPath = "/tmp/flask_monopoly.log"
        FileManager.default.createFile(atPath: logPath, contents: nil)
        let logFile = FileHandle(forWritingAtPath: logPath)
        flaskProcess?.standardOutput = logFile
        flaskProcess?.standardError = logFile
        
        do {
            try flaskProcess?.run()
            print("Flask started successfully")
            
            // Wait for Flask to be ready
            var ready = false
            for attempt in 1...30 {
                if FileManager.default.fileExists(atPath: portFilePath) {
                    // Try to read port and check if server responds
                    if let data = try? Data(contentsOf: URL(fileURLWithPath: portFilePath)),
                       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let port = json["port"] as? Int {
                        
                        // Test if Flask is responding
                        if testFlaskConnection(port: port) {
                            print("✓ Flask is ready on port \(port)!")
                            ready = true
                            Thread.sleep(forTimeInterval: 2.0) // Extra delay
                            break
                        }
                    }
                }
                print("  Waiting for Flask... Attempt \(attempt)/30")
                Thread.sleep(forTimeInterval: 1.0)
            }
            
            if !ready {
                print("✗ Flask failed to start. Check logs at \(logPath)")
            }
        } catch {
            print("Error starting Flask: \(error)")
        }
    }
    
    func testFlaskConnection(port: Int) -> Bool {
        let url = URL(string: "http://127.0.0.1:\(port)/")!
        var request = URLRequest(url: url)
        request.timeoutInterval = 2
        
        let semaphore = DispatchSemaphore(value: 0)
        var success = false
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                success = true
            }
            semaphore.signal()
        }.resume()
        
        _ = semaphore.wait(timeout: .now() + 3)
        return success
    }
    
    func getProjectPath() -> String? {
        // Try to find the project directory
        let possiblePaths = [
            NSHomeDirectory() + "/Projects/Monopoly app",
            NSHomeDirectory() + "/Documents/Monopoly app",
        ]
        
        for path in possiblePaths {
            if FileManager.default.fileExists(atPath: path + "/WebInterface") {
                return path
            }
        }
        
        return nil
    }
    
    func loadFlaskPort() {
        guard let projectPath = getProjectPath() else { return }
        let portFilePath = projectPath + "/WebInterface/.flask_port"
        
        if let data = try? Data(contentsOf: URL(fileURLWithPath: portFilePath)),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let port = json["port"] as? Int {
            flaskPort = port
            print("Loaded Flask port: \(flaskPort)")
        } else {
            print("Using default port: \(flaskPort)")
        }
    }
    
    func applicationDidBecomeActive(_ notification: Notification) {
        print("App became active")
        
        // Ensure window exists and is visible
        if propertyWindow == nil {
            createPropertyWindow()
        } else {
            // Reload content to fix blank window issue
            if let url = URL(string: "http://127.0.0.1:\(flaskPort)/") {
                let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData)
                webView.load(request)
            }
            propertyWindow.makeKeyAndOrderFront(nil)
        }
    }
    
    func setupMenuBar() {
        let mainMenu = NSMenu()
        
        // App menu
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu
        
        appMenu.addItem(NSMenuItem(title: "Monopoly", action: nil, keyEquivalent: ""))
        appMenu.addItem(NSMenuItem.separator())
        
        let boardMoveItem = NSMenuItem(title: "Board Move", action: #selector(showBoardMove), keyEquivalent: "b")
        boardMoveItem.target = self
        appMenu.addItem(boardMoveItem)
        
        let showAccountsItem = NSMenuItem(title: "Show Accounts", action: #selector(showAccountsWindow), keyEquivalent: "a")
        showAccountsItem.target = self
        appMenu.addItem(showAccountsItem)
        
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(NSMenuItem(title: "Quit Monopoly", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        NSApp.mainMenu = mainMenu
    }
    
    func createPropertyWindow() {
        // Only create window if it doesn't exist
        if propertyWindow == nil {
            propertyWindow = NSWindow(
                contentRect: NSRect(x: 100, y: 100, width: 1200, height: 800),
                styleMask: [.titled, .closable, .resizable, .miniaturizable],
                backing: .buffered,
                defer: false
            )
            propertyWindow.title = "Monopoly - Property Management"
            propertyWindow.isReleasedWhenClosed = false
            
            // Configure WKWebView with message handlers and preferences
            let config = WKWebViewConfiguration()
            config.userContentController.add(self, name: "showAccounts")
            config.userContentController.add(self, name: "boardMove")
            
            // Enable developer extras for debugging
            config.preferences.setValue(true, forKey: "developerExtrasEnabled")
            
            webView = WKWebView(frame: propertyWindow.contentView!.bounds, configuration: config)
            webView.autoresizingMask = [.width, .height]
            
            // Add navigation delegate for debugging
            webView.navigationDelegate = self
            
            propertyWindow.contentView = webView
            
            propertyWindow.center()
        }
        
        // Always load/reload content when this is called with cache bypass
        if let url = URL(string: "http://127.0.0.1:\(flaskPort)/") {
            print("Loading URL: \(url)")
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
            request.timeoutInterval = 10
            webView.load(request)
        }
        
        propertyWindow.makeKeyAndOrderFront(nil)
    }
    
    @objc func showAccountsWindow() {
        if let url = URL(string: "http://127.0.0.1:\(flaskPort)/accounts") {
            print("Loading Accounts view: \(url)")
            webView.load(URLRequest(url: url))
            propertyWindow.makeKeyAndOrderFront(nil)
        }
    }
    
    @objc func showBoardMove() {
        if let url = URL(string: "http://127.0.0.1:\(flaskPort)/") {
            print("Loading Board Move view: \(url)")
            webView.load(URLRequest(url: url))
            propertyWindow.makeKeyAndOrderFront(nil)
        }
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        // Terminate Flask server when app quits
        flaskProcess?.terminate()
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "showAccounts" {
            showAccountsWindow()
        } else if message.name == "boardMove" {
            showBoardMove()
        }
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("Started loading page")
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Finished loading page")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Failed to load: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Failed provisional navigation: \(error.localizedDescription)")
    }
}
