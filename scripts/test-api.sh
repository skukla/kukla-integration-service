#!/bin/bash

# Default values
ENDPOINT="get-products"
METHOD="POST"
LOCAL_URL="https://localhost:9080/api/v1/web/kukla-integration-service"
PROD_URL="https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service"
FIELDS="sku,name,price,qty,categories,images"
FORMAT="json"

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
    echo "  --format FORMAT            Response format (json|csv, default: json)"
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
        --format)
            FORMAT="$2"
            if [[ ! "$FORMAT" =~ ^(json|csv)$ ]]; then
                echo "Error: format must be 'json' or 'csv'"
                exit 1
            fi
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

if [ "$FORMAT" = "csv" ]; then
    PARAMS="$PARAMS&format=csv"
fi

# Execute the API call
echo "Testing endpoint: $ENDPOINT"
echo "Environment: $ENV"
echo "Method: $METHOD"
echo "Fields: $FIELDS"
echo "Format: $FORMAT"
echo

# Use -k only for local testing (self-signed cert)
CURL_OPTS=""
if [ "$ENV" = "dev" ]; then
    CURL_OPTS="-k"
fi

curl $CURL_OPTS -X "$METHOD" "$BASE_URL/$ENDPOINT?$PARAMS" | python3 -m json.tool 