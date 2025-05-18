# Kukla Integration Service

## Overview

Kukla Integration Service is an Adobe App Builder application designed to integrate with Adobe Commerce (Magento) and provide product data and related functionality via secure, scalable APIs. The project leverages Adobe App Builder's serverless actions and File Store to deliver a robust backend for commerce and integration scenarios.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Adobe Developer Console Access**
- **Adobe Commerce (Magento) Instance**
- **Adobe I/O CLI**: Install via `npm install -g @adobe/aio-cli`
- **Adobe App Builder CLI Plugin**: Install via `aio plugins:install @adobe/aio-cli-plugin-app`

## Key Features

- **Product Data Export:**
  - Fetches product data from Adobe Commerce (Magento), enriches it with inventory and category information, and exports it as a CSV file
  - Supports configurable fields and flexible data mapping
  - Handles large product catalogs efficiently with pagination
  - Includes detailed product attributes, pricing, and stock information

- **File Store Integration:**
  - Stores generated CSV files in Adobe App Builder's File Store for easy retrieval and download
  - Automatic file cleanup and management
  - Secure file access through authenticated endpoints

- **Secure Credential Management:**
  - All sensitive configuration (Magento credentials, API URLs) is managed via action inputs and environment variables
  - Support for multiple environments (development, staging, production)
  - Secure credential rotation and management

## Technologies Used

- **Adobe App Builder**: For serverless actions and File Store
- **Node.js**: Backend logic and API integration
- **Magento (Adobe Commerce)**: Source of product, inventory, and category data
- **AWS S3 Client**: For efficient file operations
- **CSV Writer**: For structured data export

## Project Structure

```plaintext
kukla-integration-service/
├── actions/
│   ├── backend/
│   │   ├── get-products/
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   │   ├── categories.js
│   │   │   │   │   └── products.js
│   │   │   │   ├── storage/
│   │   │   │   │   ├── config.js
│   │   │   │   │   └── index.js
│   │   │   │   ├── commerce-endpoints.js
│   │   │   │   ├── auth.js
│   │   │   │   └── product-transformer.js
│   │   │   ├── steps/
│   │   │   │   ├── validateInput.js
│   │   │   │   ├── fetchAndEnrichProducts.js
│   │   │   │   ├── buildProducts.js
│   │   │   │   ├── createCsv.js
│   │   │   │   └── storeCsv.js
│   │   │   └── index.js
│   │   └── download-file/
│   │       └── index.js
│   ├── utils/
│   │   ├── shared/
│   │   │   ├── http/
│   │   │   │   ├── response.js
│   │   │   │   └── headers.js
│   │   │   ├── file/
│   │   │   │   ├── size.js
│   │   │   │   └── format.js
│   │   │   └── validation/
│   │   │       └── input.js
│   │   ├── backend/
│   │   │   └── auth/
│   │   │       └── commerce.js
│   │   └── frontend/
│   │       ├── ui/
│   │       │   └── htmx.js
│   │       └── file/
│   │           └── display.js
│   └── frontend/
│       └── browse-files/
│           ├── templates.js
│           └── index.js
├── web-src/
├── test/
├── e2e/
├── dist/
├── .github/
├── app.config.yaml
├── .env
├── .env.example
├── .eslintrc.json
├── jest.setup.js
├── package.json
└── package-lock.json
```

### Directory Structure Details

#### Root Level
- `actions/` - Serverless action implementations
- `web-src/` - Frontend code
- `test/` - Unit tests
- `e2e/` - End-to-end tests
- `dist/` - Build output directory
- `.github/` - GitHub workflows and configuration
- `app.config.yaml` - App Builder configuration
- `.env` - Environment variables
- `.env.example` - Example environment configuration
- `.eslintrc.json` - ESLint configuration
- `jest.setup.js` - Jest test setup
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Locked dependency versions

#### Actions Directory (`actions/`)
The actions directory is organized into three main sections:

**Backend** (`backend/`):
- `get-products/` - Product data export functionality
  - `lib/` - Core libraries and utilities
  - `steps/` - Processing steps
  - `index.js` - Main action handler
- `download-file/` - File download handler

**Frontend** (`frontend/`):
- `browse-files/` - File browser interface
  - `templates.js` - HTMX templates
  - `index.js` - Main action handler

**Utilities** (`utils/`):
- `shared/` - Common utilities used across the application
  - `http/` - HTTP-related utilities
    - `response.js` - Common HTTP response formatting
    - `headers.js` - Header management and authentication
  - `file/` - File handling utilities
    - `size.js` - File size formatting
  - `validation/` - Input validation
    - `input.js` - Request parameter validation
- `backend/` - Backend-specific utilities
  - `auth/` - Authentication utilities
    - `commerce.js` - Adobe Commerce authentication
- `frontend/` - Frontend-specific utilities
  - `ui/` - UI-related utilities
    - `htmx.js` - HTMX response formatting

#### Get Products Action (`actions/backend/get-products/`)
Main action for product data export functionality:

**Library Modules** (`lib/`):
- `api/` - API integration modules
  - `categories.js` - Category-related API calls
  - `products.js` - Product-related API calls
- `storage/` - File storage functionality
  - `config.js` - Storage configuration
  - `index.js` - Storage operations
- `commerce-endpoints.js` - API endpoint definitions
- `auth.js` - Authentication handling
- `product-transformer.js` - Product data transformation

**Processing Steps** (`steps/`):
- `validateInput.js` - Input validation
- `fetchAndEnrichProducts.js` - Data fetching
- `buildProducts.js` - Product building
- `createCsv.js` - CSV generation
- `storeCsv.js` - CSV storage

#### Browse Files Action (`actions/frontend/browse-files/`)
Frontend action for browsing and managing exported files:
- `templates.js` - HTMX templates for UI
- `index.js` - Main action handler

#### Utility Organization
The utilities are organized into a clear hierarchy under `actions/utils/`:

```plaintext
actions/utils/
├── shared/
│   ├── http/
│   │   ├── response.js  # Common HTTP response formatting
│   │   └── headers.js   # Header management and authentication
│   ├── file/
│   │   ├── size.js      # File size formatting
│   │   └── format.js    # Common file formatting utilities
│   └── validation/
│       └── input.js     # Request parameter validation
├── backend/
│   └── auth/
│       └── commerce.js  # Adobe Commerce authentication
└── frontend/
    ├── ui/
    │   └── htmx.js     # HTMX response formatting
    └── file/
        └── display.js   # File display formatting for UI
```

This organization provides:
- Clear separation of concerns between shared, backend, and frontend utilities
- Easy discovery of utilities through logical grouping
- Prevention of code duplication through shared utilities
- Consistent patterns across the application
- Hierarchical organization of file-related utilities:
  - Shared file utilities for common operations
  - Frontend-specific file display formatting
  - Clear dependency chain from UI to shared utilities

## Detailed Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd kukla-integration-service
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Configure the following variables:
     ```
     # Adobe Commerce REST API Configuration
     COMMERCE_URL=<your-commerce-instance-url>
     COMMERCE_ADMIN_USERNAME=<your-commerce-admin-username>
     COMMERCE_ADMIN_PASSWORD=<your-commerce-admin-password>

     # Adobe I/O Runtime Configuration (provided by Adobe Developer Console)
     AIO_runtime_auth=<your-runtime-auth>
     AIO_runtime_namespace=<your-runtime-namespace>
     AIO_runtime_apihost=<your-runtime-apihost>

     # Adobe I/O Service Account Credentials
     SERVICE_API_KEY=<your-service-api-key>
     ```
   - Additional Adobe I/O configuration variables will be automatically populated when you set up your workspace using the Adobe Developer Console configuration file

3. **Adobe Developer Console Setup**
   - Create a new project in Adobe Developer Console
   - Enable App Builder and required services
   - Download the console configuration file
   - Run `aio app use <config-file>` to set up your workspace

4. **Deploy the Application**
   ```bash
   # Build and deploy
   aio app deploy
   
   # For development with local debugging
   aio app run
   ```

## Usage Guide

### Product Export Action

1. **Trigger Export:**
   ```bash
   curl -X POST <your-action-url>/api/v1/web/kukla-integration-service/get-products \
     -H "Content-Type: application/json" \
     -d '{
       "COMMERCE_URL": "<your-commerce-instance-url>",
       "COMMERCE_ADMIN_USERNAME": "<your-admin-username>",
       "COMMERCE_ADMIN_PASSWORD": "<your-admin-password>"
     }'
   ```

2. **Response Format:**
   ```json
   {
     "statusCode": 200,
     "body": {
       "message": "Product export completed successfully.",
       "file": {
         "fileName": "products.csv",
         "location": "filestore",
         "downloadUrl": "https://285361-188maroonwallaby-stage.adobeioruntime.net/api/v1/web/kukla-integration-service/download-file?fileName=products.csv"
       },
       "steps": [
         "Input validation passed.",
         "Fetched X products from the external API.",
         "Enriched products with inventory data.",
         "Built category map with Y categories.",
         "Generated CSV content in memory.",
         "Stored CSV file in filestore"
       ]
     }
   }
   ```

3. **Downloading Files:**
   - Use the returned `file.downloadUrl` to download the generated CSV file
   - The download endpoint will serve the file with proper headers for downloading
   - Authentication: Add the `Authorization` header with your bearer token:
     ```bash
     curl -H "Authorization: Bearer <your-token>" "<download-url>"
     ```
   - For S3 storage: Use the provided S3 URI with appropriate AWS credentials

## Adobe Commerce REST API Integration

The service integrates with Adobe Commerce using the following REST endpoints:

### Authentication
- **Admin Token Generation**
  ```
  POST /rest/V1/integration/admin/token
  ```
  Used to generate an admin access token for subsequent API calls.

### Product Data Retrieval
- **Product List with Pagination**
  ```
  GET /rest/V1/products?searchCriteria[currentPage]={page}&searchCriteria[pageSize]={size}
  ```
  Fetches paginated product data including:
  - Basic product information (SKU, name, price)
  - Media gallery entries
  - Extension attributes
  - Custom attributes

- **Stock Item Information**
  ```
  GET /rest/V1/stockItems/{sku}
  ```
  Retrieves inventory data for each product, including:
  - Quantity (qty)
  - Stock status

- **Category Details**
  ```
  GET /rest/V1/categories/{categoryId}
  ```
  Fetches category information for product categorization:
  - Category ID
  - Category name

### Data Processing
The service performs the following data enrichment steps:
1. Fetches base product data with pagination (200 items per page)
2. Enriches each product with its current inventory level
3. Extracts category IDs from both extension attributes and custom attributes
4. Resolves category names for all referenced categories
5. Builds a final product object with the requested fields
6. Generates and stores the CSV file with the enriched data

## Development Guidelines

- **Code Style**: Follow ESLint configuration provided in `.eslintrc.json`
- **Testing**: Write unit tests for new features in `test/` directory
- **Documentation**: Update README and inline documentation for new features
- **Security**: Never commit secrets, always use environment variables

## Troubleshooting

Common issues and solutions:

1. **Authentication Errors**
   - Verify Magento access token is valid
   - Check environment variables are properly set

2. **Deployment Issues**
   - Ensure Adobe I/O CLI is up to date
   - Verify Adobe Console configuration

3. **Export Failures**
   - Check Magento API accessibility
   - Verify File Store permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Security Considerations

- Never commit secrets or credentials to source control
- Use environment variables and action inputs for all sensitive configuration
- For production, use Adobe Console secrets or CI/CD secret management
- Regularly rotate access tokens and credentials
- Monitor application logs for unauthorized access attempts

## Support and Contact

For issues and feature requests:
- Submit GitHub issues
- Contact the project maintainers
- Check Adobe App Builder documentation for platform-specific questions

## Documentation

### Design System
For detailed information about our design system, including colors, typography, components, and usage guidelines, please see our [Design System Documentation](docs/design-system.md).

The design system documentation covers:
- Design tokens (colors, typography, spacing, etc.)
- Component specifications
- Layout patterns
- Accessibility guidelines
- Best practices

---

For more details, see the inline documentation in each module or contact the project maintainers.
