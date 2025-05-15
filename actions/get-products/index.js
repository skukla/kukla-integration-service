/**
 * Main action for exporting Adobe Commerce product data to CSV
 * @module get-products
 */

const dotenv = require('dotenv');
const path = require('path');
const { Core } = require('@adobe/aio-sdk');
const validateInput = require('./steps/validateInput');
const fetchAndEnrichProducts = require('./steps/fetchAndEnrichProducts');
const buildProducts = require('./steps/buildProducts');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');
const { getRequestedFields } = require('./lib/product-transformer');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Main function that orchestrates the product export process
 * 
 * @param {Object} params - Action parameters
 * @param {string} params.COMMERCE_URL - Adobe Commerce instance URL
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username for authentication
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password for authentication
 * @param {string} [params.LOG_LEVEL='info'] - Logging level
 * @param {Array<string>} [params.fields] - Optional array of fields to include in the export
 * 
 * @returns {Promise<Object>} Action response
 * @property {number} statusCode - HTTP status code (200 for success, 500 for error)
 * @property {Object} body - Response body
 * @property {string} body.message - Success or error message
 * @property {Object} body.file - File information
 * @property {string} body.file.downloadUrl - URL to download the generated CSV
 * @property {string[]} body.steps - Array of processing steps for tracking progress
 * 
 * @throws {Error} If any step in the process fails
 */
async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  const steps = [];

  try {
    // Step 1: Validate input
    const validationResult = await validateInput(params);
    steps.push(validationResult);

    // Step 2: Fetch and enrich products
    const { products, productsWithInventory, categoryMap } = await fetchAndEnrichProducts(params);
    steps.push(`Fetched ${products.length} products from Adobe Commerce`);
    steps.push('Enriched products with inventory data');
    steps.push(`Built category map with ${Object.keys(categoryMap).length} categories`);

    // Step 3: Build product objects with requested fields
    const requestedFields = getRequestedFields(params);
    const productsWithCategories = buildProducts(productsWithInventory, requestedFields, categoryMap);
    steps.push(`Constructed ${productsWithCategories.length} product objects for CSV export`);

    // Step 4: Generate CSV in memory
    const { fileName, content } = await createCsv(productsWithCategories);
    steps.push('Generated CSV content in memory');

    // Step 5: Store CSV
    const storageResult = await storeCsv(content, fileName);
    steps.push(`Stored CSV file as "${storageResult.fileName}"`);

    return {
      statusCode: 200,
      body: {
        message: 'Product export completed successfully.',
        file: {
          downloadUrl: storageResult.downloadUrl
        },
        steps
      }
    };
  } catch (error) {
    logger.error('Error in main action:', error);
    steps.push(`Error: ${error.message || error.toString()}`);
    return { 
      statusCode: 500, 
      body: { 
        error: 'server error',
        details: error.message || error.toString(),
        steps
      } 
    };
  }
}

exports.main = main;
