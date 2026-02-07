#!/usr/bin/env python3
"""
Script to add files to Xcode project
"""
import subprocess
import os
import sys

# Files to add to the project
files_to_add = [
    "Monopoly/DataManager.swift",
    "Monopoly/Asset_database.json",
    "Monopoly/Player_database.json",
    "Monopoly/Player_accounts.json",
    "Monopoly/Commercial_properties.json"
]

project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(os.path.join(project_dir, "Monopoly"))

# For each file, we'll use shell commands to add them via Xcode project manipulation
# Since we can't easily use pbxproj Python library, we'll manually open and build in Xcode

print("Files that need to be added to Xcode project:")
for file in files_to_add:
    filepath = os.path.join(project_dir, file)
    if os.path.exists(filepath):
        print(f"✓ {file}")
    else:
        print(f"✗ {file} (NOT FOUND)")

print("\nPlease add these files to the Xcode project manually:")
print("1. Open MacAppSwift/Monopoly/Monopoly.xcodeproj in Xcode")
print("2. Right-click on the 'Monopoly' folder in the navigator")
print("3. Select 'Add Files to Monopoly...'")
print("4. Add DataManager.swift (ensure 'Copy items if needed' is UNCHECKED)")
print("5. Add all JSON files (ensure 'Copy items if needed' is UNCHECKED)")
print("6. For JSON files, make sure they are added to the target")
