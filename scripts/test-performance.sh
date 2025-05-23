#!/bin/bash

# Default values
ITERATIONS=3

# Get base URL from Node.js configuration
PROD_URL=$(node -e "
    const { getBaseUrl } = require('../config/urls');
    try {
        console.log(getBaseUrl('stage'));
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
")

if [ $? -ne 0 ]; then
    echo "Error: Failed to get base URL for stage environment"
    exit 1
fi

# Help function
show_help() {
    echo "Performance Testing Tool for Adobe Commerce Integration Service"
    echo
    echo "Usage:"
    echo "  $0 [options]"
    echo
    echo "Options:"
    echo "  -n, --iterations N    Number of test iterations (default: 3)"
    echo "  -h, --help           Show this help message"
    echo
    echo "This tool runs multiple iterations of the product export"
    echo "and provides detailed performance metrics including:"
    echo "  - Compression ratios"
    echo "  - Memory usage at each stage"
    echo "  - Execution times"
    echo "  - Data processing statistics"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -n|--iterations)
            ITERATIONS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Load environment variables
if [ ! -f ".env" ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Load only Commerce-related variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Only process Commerce variables
    case "$key" in
        COMMERCE_URL|COMMERCE_ADMIN_USERNAME|COMMERCE_ADMIN_PASSWORD)
            # Remove quotes if present
            value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            export "$key=$value"
            ;;
    esac
done < .env

# Validate required environment variables
if [ -z "$COMMERCE_URL" ] || [ -z "$COMMERCE_ADMIN_USERNAME" ] || [ -z "$COMMERCE_ADMIN_PASSWORD" ]; then
    echo "Error: Missing required environment variables in .env file"
    exit 1
fi

# Function to format bytes to human readable
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(( bytes / 1024 ))KB"
    else
        echo "$(( bytes / 1048576 ))MB"
    fi
}

# Function to calculate average
calculate_average() {
    local values=("$@")
    local sum=0
    local count=${#values[@]}
    
    if [ $count -eq 0 ]; then
        echo "0"
        return
    fi
    
    for value in "${values[@]}"; do
        sum=$(echo "$sum + $value" | bc)
    done
    echo "scale=1; $sum / $count" | bc
}

echo "Running performance test with $ITERATIONS iterations..."
echo

# Arrays to store metrics
declare -a execution_times
declare -a compression_ratios
declare -a peak_memories

for ((i=1; i<=$ITERATIONS; i++)); do
    echo "Iteration $i of $ITERATIONS:"
    
    # Make the API call with production mode and format=csv to ensure file operations
    response=$(curl -s -H "Content-Type: application/json" \
        "$PROD_URL/get-products?commerce_url=$COMMERCE_URL&commerce_admin_username=$COMMERCE_ADMIN_USERNAME&commerce_admin_password=$COMMERCE_ADMIN_PASSWORD&format=csv&env=prod")
    
    # Print raw response for debugging
    echo "Raw response:"
    echo "$response" | python3 -m json.tool --indent 2
    
    # Extract metrics using a more robust Python script
    metrics=$(echo "$response" | python3 -c "
import sys, json
import re

try:
    data = json.load(sys.stdin)
    perf = data.get('performance', {})
    
    # Extract execution time
    execution_time = float(perf.get('executionTime', '0s').replace('s', ''))
    
    # Extract compression ratio from compression stats using regex
    compression = perf.get('compression', {})
    if compression and 'savingsPercent' in compression:
        savings_str = compression['savingsPercent']
        match = re.search(r'(\d+\.?\d*)', savings_str)
        compression_ratio = float(match.group(1)) if match else 0.0
    else:
        compression_ratio = 0.0
    
    # Extract peak memory from memory metrics using regex
    memory_data = perf.get('memory', {})
    if memory_data and 'peak' in memory_data:
        memory_str = memory_data['peak']
        match = re.search(r'(\d+\.?\d*)', memory_str)
        peak_memory = float(match.group(1)) if match else 0.0
    else:
        peak_memory = 0.0
    
    # Output metrics as JSON
    metrics = {
        'execution_time': execution_time,
        'compression_ratio': compression_ratio,
        'peak_memory': peak_memory
    }
    print(json.dumps(metrics))
except Exception as e:
    print(f'Error parsing response: {e}', file=sys.stderr)
    print(json.dumps({
        'execution_time': 0,
        'compression_ratio': 0,
        'peak_memory': 0
    }))
")

    # Parse metrics JSON
    execution_time=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['execution_time'])")
    compression_ratio=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['compression_ratio'])")
    peak_memory=$(echo "$metrics" | python3 -c "import sys, json; print(json.load(sys.stdin)['peak_memory'])")

    # Store metrics in arrays
    execution_times+=("$execution_time")
    compression_ratios+=("$compression_ratio")
    peak_memories+=("$peak_memory")

    # Display iteration results with proper formatting
    printf "  Execution Time: %.1fs\n" "$execution_time"
    printf "  Compression Ratio: %.1f%%\n" "$compression_ratio"
    printf "  Peak Memory: %.1fMB\n" "$peak_memory"
    echo
done

# Calculate and display averages
echo "Performance Summary (${ITERATIONS} iterations):"
echo "----------------------------------------"

# Calculate averages using awk
if [ ${#execution_times[@]} -gt 0 ]; then
    # Join array elements with newlines and calculate average using awk
    avg_execution=$(printf "%s\n" "${execution_times[@]}" | awk '{ sum += $1 } END { printf "%.1f", sum/NR }')
    avg_compression=$(printf "%s\n" "${compression_ratios[@]}" | awk '{ sum += $1 } END { printf "%.1f", sum/NR }')
    avg_memory=$(printf "%s\n" "${peak_memories[@]}" | awk '{ sum += $1 } END { printf "%.1f", sum/NR }')

    printf "Average Execution Time: %.1fs\n" "$avg_execution"
    printf "Average Compression Ratio: %.1f%%\n" "$avg_compression"
    printf "Average Peak Memory: %.1fMB\n" "$avg_memory"
else
    echo "No valid metrics collected"
fi

echo "Detailed Memory Stage Analysis (last run):"
echo "----------------------------------------"
echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    metrics = data.get('performance', {}).get('memory', {})
    for stage, value in metrics.items():
        if stage != 'peak':
            print(f'{stage}: {value}')
except Exception as e:
    print('No detailed memory metrics available')
" 