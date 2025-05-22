#!/bin/bash

# Configuration
TIMEOUT=60
LOG_FILE="dev.log"

# Helper function for waiting with progress
wait_for_pattern() {
    local pattern=$1
    local message=$2
    local count=0

    echo "$message (timeout: ${TIMEOUT}s)..."
    
    until grep -q "$pattern" "$LOG_FILE" || [ $count -eq $TIMEOUT ]; do
        sleep 1
        count=$((count+1))
        printf "."
    done
    echo

    if [ $count -eq $TIMEOUT ]; then
        echo "Timeout waiting for: $message"
        exit 1
    fi
}

# Wait for build to start
wait_for_pattern "Building the app" "Waiting for app build"
echo "Build started..."

# Wait for server to be running
wait_for_pattern "server running on port : 9080" "Waiting for server"
echo "Server is running!" 