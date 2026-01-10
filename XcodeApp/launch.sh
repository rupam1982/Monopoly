#!/bin/bash

# MonopolyApp - Simple launcher script
# This creates a basic macOS app that opens two web windows

cd "$(dirname "$0")"

# Start Flask if not running
echo "Checking Flask server..."

# Check if Flask is already running by looking for the process
if pgrep -f "python.*run.py" > /dev/null 2>&1; then
    echo "✓ Flask already running"
else
    echo "Starting Flask server..."
    cd ../WebInterface
    
    # Remove old port config file
    rm -f .flask_port
    
    source ../.venv/bin/activate 2>/dev/null || true
    python run.py > /tmp/flask_monopoly.log 2>&1 &
    FLASK_PID=$!
    echo "Flask started with PID: $FLASK_PID"
    cd - > /dev/null
    
    # Wait for port config file to be created
    echo "Waiting for Flask to start..."
    READY=0
    for i in {1..20}; do
        if [ -f "../WebInterface/.flask_port" ]; then
            FLASK_PORT=$(grep -o '"port": [0-9]*' ../WebInterface/.flask_port | grep -o '[0-9]*')
            if [ ! -z "$FLASK_PORT" ]; then
                if curl -s http://127.0.0.1:$FLASK_PORT/ > /dev/null 2>&1; then
                    echo "✓ Flask is ready on port $FLASK_PORT!"
                    READY=1
                    # Extra delay to ensure Flask is fully initialized
                    sleep 2
                    break
                fi
            fi
        fi
        echo "  Attempt $i/20..."
        sleep 1
    done
    
    if [ $READY -eq 0 ]; then
        echo "✗ Flask failed to start. Check logs:"
        tail -20 /tmp/flask_monopoly.log
        exit 1
    fi
fi

# Read the port from config file
if [ -f "../WebInterface/.flask_port" ]; then
    FLASK_PORT=$(grep -o '"port": [0-9]*' ../WebInterface/.flask_port | grep -o '[0-9]*')
    echo "Using Flask port: $FLASK_PORT"
else
    echo "✗ Could not find Flask port configuration"
    exit 1
fi

# Create and run the Swift app
cat > /tmp/monopoly_macos_app.swift << 'SWIFTCODE'
import Cocoa
import WebKit

class MonopolyAppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var propertyWindow: NSWindow!
    var webView: WKWebView!
    var flaskPort: Int = 5001  // Default port
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launching...")
        
        // Read Flask port from config file
        loadFlaskPort()
        
        // Create menu bar
        setupMenuBar()
        
        // Create Property Management window on launch
        createPropertyWindow()
        
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func loadFlaskPort() {
        // Get the path to WebInterface/.flask_port
        let scriptPath = CommandLine.arguments[0]
        let scriptDir = URL(fileURLWithPath: scriptPath).deletingLastPathComponent().path
        let portFilePath = scriptDir + "/../WebInterface/.flask_port"
        
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

let app = NSApplication.shared
let delegate = MonopolyAppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
SWIFTCODE

# Compile and run
echo "Compiling app..."
swiftc /tmp/monopoly_macos_app.swift -o /tmp/MonopolyMacApp

if [ $? -eq 0 ]; then
    echo "✓ Compiled successfully!"
    echo "🚀 Launching Monopoly App..."
    /tmp/MonopolyMacApp
else
    echo "✗ Compilation failed"
    exit 1
fi
