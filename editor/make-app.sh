#!/bin/bash
# Builds "Collection Editor.app" in ~/Applications. The app starts the local
# editor server from this folder and opens the editor window.
# Run again if you move the repository folder.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Applications/Collection Editor.app"
mkdir -p "$HOME/Applications"
rm -rf "$APP"
SCRIPT="do shell script \"cd \" & quoted form of \"$HERE\" & \" && /usr/bin/python3 server.py --open > /tmp/collection-editor.log 2>&1 &\""
osacompile -o "$APP" -e "$SCRIPT"
if [ -f "$HERE/icon.icns" ]; then
  cp "$HERE/icon.icns" "$APP/Contents/Resources/applet.icns"
  touch "$APP"
fi
echo "Created: $APP"
