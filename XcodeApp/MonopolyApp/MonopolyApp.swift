import Cocoa
import WebKit

@main
class MonopolyAppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var propertyWindow: NSWindow!
    var webView: WKWebView!
    var flaskPort: Int = 5001  // Default port
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSLog("App launching...")
        
        // Read Flask port from config file
        loadFlaskPort()
        
        // Create menu bar
        setupMenuBar()
        
        // Create Property Management window on launch
        createPropertyWindow()
        
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func loadFlaskPort() {
        // Get the path to WebInterface/.flask_port relative to app bundle
        let bundlePath = Bundle.main.bundlePath
        let bundleURL = URL(fileURLWithPath: bundlePath)
        let projectURL = bundleURL.deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let portFilePath = projectURL.appendingPathComponent("WebInterface/.flask_port").path
        
        if let data = try? Data(contentsOf: URL(fileURLWithPath: portFilePath)),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let port = json["port"] as? Int {
            flaskPort = port
            print("Loaded Flask port: \(flaskPort)")
            return
        }
        
        // Fallback: try from executable path
        let scriptPath = CommandLine.arguments[0]
        let scriptDir = URL(fileURLWithPath: scriptPath).deletingLastPathComponent().path
        let fallbackPortFilePath = scriptDir + "/../WebInterface/.flask_port"
        
        if let data = try? Data(contentsOf: URL(fileURLWithPath: fallbackPortFilePath)),
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
        
        let boardMoveItem = NSMenuItem(title: "Board move", action: #selector(showBoardMove), keyEquivalent: "b")
        boardMoveItem.target = self
        appMenu.addItem(boardMoveItem)
        
        let showAccountsItem = NSMenuItem(title: "Show Accounts", action: #selector(showAccountsWindow), keyEquivalent: "a")
        showAccountsItem.target = self
        appMenu.addItem(showAccountsItem)
        
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
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
            propertyWindow.title = "Monopoly"
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
