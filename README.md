# Kukla Integration Service

## Overview

Kukla Integration Service is an Adobe App Builder application designed to integrate with Adobe Commerce (Magento) and provide product data and related functionality via secure, scalable APIs. The project leverages Adobe App Builder's serverless actions, API Mesh, and File Store to deliver a robust backend for commerce and integration scenarios.

## Key Features

- **Product Data Export:**
  - Fetches product data from Adobe Commerce (Magento), enriches it with inventory and category information, and exports it as a CSV file.
  - Supports configurable fields and flexible data mapping.

- **File Store Integration:**
  - Stores generated CSV files in Adobe App Builder's File Store for easy retrieval and download.

- **API Mesh Integration:**
  - Optionally uses Adobe App Builder API Mesh to aggregate and orchestrate backend API calls, providing a unified GraphQL endpoint for product and catalog data.

- **Secure Credential Management:**
  - All sensitive configuration (Magento credentials, API URLs) is managed via action inputs and environment variables, never hardcoded.

- **Modular, Maintainable Codebase:**
  - Clean separation of concerns with dedicated modules for Magento config, endpoint construction, and business logic.
  - Easily extensible for new endpoints, data sources, or output formats.

## Technologies Used

- **Adobe App Builder**: For serverless actions, File Store, and API Mesh.
- **Node.js**: Backend logic and API integration.
- **Magento (Adobe Commerce)**: Source of product, inventory, and category data.
- **API Mesh**: Unified GraphQL layer for backend APIs.

## Project Structure

- `actions/` - All backend action code, including product helpers, storage, and CSV generation.
- `web-src/` - (Optional) Frontend code for UI or admin tools.
- `app.config.yaml` - Main configuration file for actions, inputs, and runtime settings.
- `mesh.json` - API Mesh configuration (if used).

## Getting Started

1. **Set up your `.env` file** with Magento credentials and API URL.
2. **Configure action inputs** in `app.config.yaml` to use environment variables.
3. **Deploy the app** using `aio app deploy`.
4. **Invoke the product export action** via the provided web action URL.
5. **Download generated CSV files** from File Store as needed.

## Security

- Never commit secrets or credentials to source control.
- Use environment variables and action inputs for all sensitive configuration.
- For production, use Adobe Console secrets or CI/CD secret management if available.

## Extending the Project

- Add new endpoints to `magentoEndpoints.js` as needed.
- Use API Mesh for new data sources or to aggregate multiple APIs.
- Add new actions or web UI components as your integration grows.

---

For more details, see the inline documentation in each module or contact the project maintainers.
