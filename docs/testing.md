# Testing Guide

## API Testing

The project includes a unified testing script for validating API endpoints in both development and production environments.

### Quick Start

```bash
# Test in development environment (default)
npm run test:api

# Test in production environment
npm run test:api -- --env prod

# Show all testing options
npm run test:api:help
```

### Environment Setup

1. Create a `.env` file with your credentials:
```bash
COMMERCE_URL=your-commerce-instance
COMMERCE_ADMIN_USERNAME=admin
COMMERCE_ADMIN_PASSWORD=your-password
```

2. Ensure the testing script is executable:
```bash
chmod +x scripts/test-api.sh
```

### Testing Environments

The testing script requires explicit environment specification to prevent accidental testing in the wrong environment:

- **Development** (`--env dev`)
  - Endpoint: `https://localhost:9080/api/v1/web/kukla-integration-service`
  - Uses self-signed certificates (automatically handled)
  - Requires local development server to be running

- **Production** (`--env prod`)
  - Endpoint: `https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service`
  - Requires valid production credentials

### Available Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--env` | Testing environment (required) | none | `--env dev` |
| `--endpoint` | API endpoint to test | get-products | `--endpoint get-categories` |
| `--fields` | Fields to include in response | all fields | `--fields sku,name,price` |
| `--format` | Response format | json | `--format csv` |

### Available Fields

The following fields can be requested using the `--fields` option:
- `sku` - Product SKU
- `name` - Product name
- `price` - Product price
- `qty` - Current inventory quantity
- `categories` - Associated categories
- `images` - Product images

Note: The API always fetches complete product data internally but returns only the requested fields in the response.

### Common Testing Scenarios

1. **Basic Development Testing**
```bash
# Test get-products endpoint with all fields
npm run test:api

# Test specific endpoint
npm run test:api -- --endpoint get-categories
```

2. **Production Testing**
```bash
# Test with all fields in production
npm run test:api -- --env prod

# Test with minimal data in production
npm run test:api -- --env prod --fields sku,name
```

3. **Field Selection**
```bash
# Get only basic product information
npm run test:api -- --fields sku,name,price

# Get inventory-focused data
npm run test:api -- --fields sku,name,qty

# Get full product details
npm run test:api -- --fields sku,name,price,qty,categories,images
```

4. **Format Options**
```bash
# Get JSON response (default)
npm run test:api

# Get CSV format
npm run test:api -- --format csv
```

### Response Formats

1. **JSON Response** (default)
```json
{
  "success": true,
  "message": "Product export completed successfully.",
  "data": [
    {
      "sku": "product-sku",
      "name": "Product Name",
      "price": 99.99
    }
  ]
}
```

2. **CSV Response** (when using `--format csv`)
```json
{
  "success": true,
  "message": "Product export completed successfully.",
  "file": {
    "downloadUrl": "https://storage.url/products.csv"
  }
}
```

### Error Handling

The script handles several types of errors:

1. **Environment Errors**
```bash
# Missing environment specification
./scripts/test-api.sh  # Error: --env must be specified (dev or prod)

# Invalid environment
./scripts/test-api.sh --env staging  # Error: --env must be specified as 'dev' or 'prod'
```

2. **Configuration Errors**
```bash
# Missing credentials
Error: Missing required environment variables. Please set them in .env file:
COMMERCE_URL=
COMMERCE_ADMIN_USERNAME=
COMMERCE_ADMIN_PASSWORD=
```

3. **Validation Errors**
```bash
# Invalid fields
Error: Invalid field 'invalid'. Valid fields are: sku name price qty categories images

# Invalid format
Error: format must be 'json' or 'csv'
```

### Integration with Development Workflow

When testing with a local development server, follow these explicit steps:

1. Start the server:
```bash
# Interactive mode (blocks terminal)
npm run start

# Or background mode
npm run start:bg
```

2. If using background mode, wait for server readiness:
```bash
./scripts/wait-for-server.sh
```

3. Run the tests:
```bash
npm run test:api
```

4. Monitor and manage logs:
```bash
# View logs
npm run logs

# Clear logs if needed
npm run logs:clear
```

### Best Practices

1. **Environment Safety**
   - Always explicitly specify the environment with `--env prod` when testing in production
   - Use `npm run test:api` for development testing (defaults to dev environment)
   - Double-check environment flag when testing in production

2. **Performance**
   - Request only needed fields using `--fields`
   - Use `--no-inventory` and `--no-categories` when that data isn't needed
   - Consider using CSV format for large data sets

3. **Development Testing**
   - Choose between interactive (`npm run start`) or background (`npm run start:bg`) server mode
   - When using background mode, ensure server is ready with `./scripts/wait-for-server.sh`
   - Monitor logs with `npm run logs`
   - Keep logs clean with `npm run logs:clear` when needed 