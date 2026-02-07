//
//  ContentView.swift
//  Monopoly
//
//  Created by Rupam Mukherjee on 15/01/26.
//
//  This file is kept for compatibility but is not actively used.
//  The app uses AppKit/WebKit instead of SwiftUI.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Monopoly")
                .font(.largeTitle)
                .padding()
            Text("Loading web interface...")
                .foregroundColor(.secondary)
        }
        .frame(width: 400, height: 300)
    }
}

#Preview {
    ContentView()
}
