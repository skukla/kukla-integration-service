/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */
const { Core } = require('@adobe/aio-sdk');
const { extractActionParams } = require('../../core/http');
const { getAuthToken } = require('./lib/auth');
const { fetchAllProducts, enrichWithInventory } = require('./lib/api/products');
const { buildCategoryMap } = require('./lib/api/categories');
const { buildProductObject, DEFAULT_FIELDS } = require('./lib/product-transformer');
const { performance } = require('perf_hooks');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');

/**
 * Main action handler for get-products
 * @param {Object} rawParams - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(rawParams) {
  const logger = Core.Logger('main', { level: rawParams.LOG_LEVEL || 'info' });
  const startTime = performance.now();
  const steps = [];
  
  try {
    // Extract and validate parameters
    const params = extractActionParams(rawParams);
    
    // Check for development mode using query parameters
    const isDev = (rawParams.__ow_query && rawParams.__ow_query.env === 'dev') || rawParams.env === 'dev';
    
    // Step 1: Get authentication token
    const token = await getAuthToken(params);
    steps.push('Authentication successful');

    // Step 2: Fetch products with pagination
    const products = await fetchAllProducts(token, params);
    steps.push(`Fetched ${products.length} products from Adobe Commerce`);

    // Step 3: Enrich with inventory data
    const productsWithInventory = await enrichWithInventory(products, token, params);
    steps.push(`Enriched ${productsWithInventory.length} products with inventory data`);

    // Step 4: Build category map and enrich products
    const categoryMap = await buildCategoryMap(productsWithInventory, token, params);
    steps.push(`Built category map with ${Object.keys(categoryMap).length} categories`);

    // Step 5: Transform products
    const transformedProducts = productsWithInventory.map(product => 
      buildProductObject(product, DEFAULT_FIELDS, categoryMap)
    );
    steps.push(`Transformed ${transformedProducts.length} products`);

    // Check for development mode
    if (isDev) {
      steps.push('CSV creation and storage steps skipped in development environment');
      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'Product export completed successfully',
          steps
        }
      };
    }

    // Step 6: Generate CSV file
    const csvFile = await createCsv(transformedProducts);
    steps.push('Generated CSV content in memory');

    // Step 7: Store CSV file
    const storageResult = await storeCsv(csvFile);
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
    logger.error('Error in get-products action:', error);
    steps.push(`Error: ${error.message}`);

    return {
      statusCode: error.statusCode || 500,
      body: {
        error: error.message || 'server error',
        details: isDev ? error.stack : undefined,
        steps
      }
    };
  }
}

exports.main = main;
