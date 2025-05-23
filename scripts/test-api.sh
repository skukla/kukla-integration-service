#!/bin/bash

# Default values
ENDPOINT="get-products"
METHOD="POST"
LOCAL_URL="https://localhost:9080/api/v1/web/kukla-integration-service"
PROD_URL="https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service"
FIELDS="sku,name,price,qty,categories,images"

# Function to check if dev server is running
check_dev_server() {
    curl -k -s -o /dev/null -w "%{http_code}" "https://localhost:9080" > /dev/null 2>&1
    return $?
}

# Function to start dev server
start_dev_server() {
    echo "Starting development server..."
    npm run dev:actions &
    DEV_SERVER_PID=$!
    
    # Wait for server to start (max 30 seconds)
    for i in {1..30}; do
        if check_dev_server; then
            echo "Development server is ready"
            return 0
        fi
        sleep 1
    done
    
    echo "Error: Development server failed to start"
    kill $DEV_SERVER_PID 2>/dev/null
    return 1
}

# Function to cleanup dev server
cleanup_dev_server() {
    if [ ! -z "$DEV_SERVER_PID" ]; then
        echo "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null
    fi
}

# Load environment variables if .env exists
if [ -f ".env" ]; then
    # Read .env file but only process Commerce-related variables
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
fi

# Help function
show_help() {
    echo "Adobe Commerce Integration Service API Testing Tool"
    echo
    echo "Usage:"
    echo "  $0 --env <dev|prod> [options]"
    echo
    echo "Required:"
    echo "  --env ENV                  Environment to test against (dev|prod)"
    echo
    echo "Options:"
    echo "  -e, --endpoint ENDPOINT    Specify the endpoint to test (default: get-products)"
    echo "  -m, --method METHOD        HTTP method to use (default: POST)"
    echo "  --fields FIELDS            Comma-separated list of fields to return"
    echo "                             Available fields: sku,name,price,qty,categories,images"
    echo "                             Default: all fields"
    echo "  -h, --help                 Show this help message"
    echo
    echo "Environment Variables (required in .env):"
    echo "  COMMERCE_URL               Commerce instance URL"
    echo "  COMMERCE_ADMIN_USERNAME    Commerce admin username"
    echo "  COMMERCE_ADMIN_PASSWORD    Commerce admin password"
    echo
    echo "Examples:"
    echo "  1. Test in development:"
    echo "    $0 --env dev"
    echo
    echo "  2. Test in production:"
    echo "    $0 --env prod"
    echo
    echo "  3. Test with specific fields:"
    echo "    $0 --env dev --fields sku,name,price"
    echo
    echo "  4. Get CSV format:"
    echo "    $0 --env prod --format csv"
    echo
    echo "  5. Get minimal product data:"
    echo "    $0 --env dev --fields sku,name"
}

# Validate fields
validate_fields() {
    local fields=$1
    local valid_fields="sku name price qty categories images"
    
    IFS=',' read -ra FIELD_ARRAY <<< "$fields"
    for field in "${FIELD_ARRAY[@]}"; do
        if [[ ! " $valid_fields " =~ " $field " ]]; then
            echo "Error: Invalid field '$field'. Valid fields are: $valid_fields"
            exit 1
        fi
    done
}

# Initialize ENV as unset
ENV=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--endpoint)
            ENDPOINT="$2"
            shift 2
            ;;
        -m|--method)
            METHOD="$2"
            shift 2
            ;;
        --env)
            ENV="$2"
            if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
                echo "Error: --env must be specified as 'dev' or 'prod'"
                exit 1
            fi
            shift 2
            ;;
        --fields)
            FIELDS="$2"
            validate_fields "$2"
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

# Check if environment is specified
if [ -z "$ENV" ]; then
    echo "Error: --env must be specified (dev or prod)"
    echo "Usage: $0 --env <dev|prod> [options]"
    exit 1
fi

# Validate required environment variables
if [ -z "$COMMERCE_URL" ] || [ -z "$COMMERCE_ADMIN_USERNAME" ] || [ -z "$COMMERCE_ADMIN_PASSWORD" ]; then
    echo "Error: Missing required environment variables. Please set them in .env file:"
    echo "COMMERCE_URL="
    echo "COMMERCE_ADMIN_USERNAME="
    echo "COMMERCE_ADMIN_PASSWORD="
    exit 1
fi

# Build the base URL based on environment
BASE_URL="$LOCAL_URL"
if [ "$ENV" = "prod" ]; then
    BASE_URL="$PROD_URL"
fi

# Build query parameters
PARAMS="commerce_url=$COMMERCE_URL&commerce_admin_username=$COMMERCE_ADMIN_USERNAME&commerce_admin_password=$COMMERCE_ADMIN_PASSWORD"

if [ ! -z "$FIELDS" ]; then
    PARAMS="$PARAMS&fields=$FIELDS"
fi

# Include environment parameter
PARAMS="$PARAMS&env=$ENV"

# Start dev server if testing in dev environment
if [ "$ENV" = "dev" ]; then
    # Set up trap to cleanup dev server on script exit
    trap cleanup_dev_server EXIT
    
    if ! check_dev_server; then
        if ! start_dev_server; then
            echo "Failed to start development server"
            exit 1
        fi
    else
        echo "Development server is already running"
    fi
fi

# Execute the API call
echo "Testing endpoint: $ENDPOINT"
echo "Environment: $ENV"
echo "Method: $METHOD"
echo "Fields: $FIELDS"
echo

# Use -k only for local testing (self-signed cert)
CURL_OPTS=""
if [ "$ENV" = "dev" ]; then
    CURL_OPTS="-k"
fi

curl $CURL_OPTS -X "$METHOD" "$BASE_URL/$ENDPOINT?$PARAMS" | python3 -m json.tool 