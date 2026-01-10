import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window1: NSWindow!
    var window2: NSWindow!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create first window
        window1 = NSWindow(
            contentRect: NSRect(x: 100, y: 100, width: 1200, height: 800),
            styleMask: [.titled, .closable, .resizable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window1.title = "Property Management"
        let webView1 = WKWebView(frame: window1.contentView!.bounds)
        webView1.autoresizingMask = [.width, .height]
        window1.contentView = webView1
        webView1.load(URLRequest(url: URL(string: "http://127.0.0.1:5000/")!))
        window1.center()
        window1.makeKeyAndOrderFront(nil)
        
        // Create second window
        window2 = NSWindow(
            contentRect: NSRect(x: 150, y: 150, width: 1200, height: 800),
            styleMask: [.titled, .closable, .resizable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window2.title = "Accounts & Transactions"
        let webView2 = WKWebView(frame: window2.contentView!.bounds)
        webView2.autoresizingMask = [.width, .height]
        window2.contentView = webView2
        webView2.load(URLRequest(url: URL(string: "http://127.0.0.1:5000/accounts")!))
        window2.center()
        window2.makeKeyAndOrderFront(nil)
        
        NSApp.activate(ignoringOtherApps: true)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
