#!/bin/bash
# Double-click this file to start the Collection Editor.
cd "$(dirname "$0")" || exit 1
exec /usr/bin/python3 -u server.py --open
