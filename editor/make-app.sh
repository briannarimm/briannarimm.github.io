#!/bin/bash
# Builds "Collection Editor.app" in ~/Applications.
#
# The app is one program: it starts the editor server when it opens and stops
# the server when it quits (or when you close its window). Nothing keeps
# running in the background.
#
# Run this script again after you move the repository folder or change
# app/main.swift. It needs the Xcode command-line tools (swiftc).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Applications/Collection Editor.app"
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

echo "Compiling..."
xcrun swiftc -O -o "$BUILD/CollectionEditor" "$HERE/app/main.swift" -framework Cocoa -framework WebKit

echo "Drawing the icon..."
xcrun swift "$HERE/app/icon.swift" "$BUILD/AppIcon.iconset" >/dev/null
iconutil -c icns "$BUILD/AppIcon.iconset" -o "$BUILD/AppIcon.icns"

echo "Assembling the app..."
mkdir -p "$HOME/Applications"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BUILD/CollectionEditor" "$APP/Contents/MacOS/CollectionEditor"
cp "$BUILD/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Collection Editor</string>
  <key>CFBundleDisplayName</key><string>Collection Editor</string>
  <key>CFBundleIdentifier</key><string>com.briannaimm.collection-editor</string>
  <key>CFBundleExecutable</key><string>CollectionEditor</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>2.0</string>
  <key>CFBundleVersion</key><string>2</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
  <key>EditorPath</key><string>$HERE</string>
</dict>
</plist>
PLIST
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
touch "$APP"
echo "Created: $APP"
