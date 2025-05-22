#!/bin/bash

# Find and kill the dev server process
pkill -f "aio app dev"

# Find and kill any node processes running on port 9080
lsof -ti:9080 | xargs kill -9 2>/dev/null

echo "Development server stopped" 