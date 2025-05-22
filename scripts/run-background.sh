#!/bin/bash

# Configuration
LOG_FILE="dev.log"

# Clean up any existing processes
pkill -f 'aio app dev' || true

# Clean build artifacts
rm -rf .parcel-cache dist

# Clean logs
echo "" > "$LOG_FILE"

# Start the service in background
aio app dev >> "$LOG_FILE" 2>&1 &

# Show initial logs
cat "$LOG_FILE" 