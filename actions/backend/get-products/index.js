/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

/**
 * @typedef {Object} ActionParams
 * @property {string} COMMERCE_URL - Adobe Commerce instance URL
 * @property {string} COMMERCE_ADMIN_USERNAME - Admin username for authentication
 * @property {string} COMMERCE_ADMIN_PASSWORD - Admin password for authentication
 * @property {string} [LOG_LEVEL='info'] - Logging level
 * @property {string} [fields] - Comma-separated list of fields to include
 * @property {boolean} [include_inventory=true] - Whether to include inventory data
 * @property {boolean} [include_categories=true] - Whether to include category data
 * @property {string} [env] - Environment setting ('dev' or 'prod')
 */

/**
 * @typedef {Object} ProductData
 * @property {string} sku - Product SKU
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {Object} [inventory] - Inventory information
 * @property {number} inventory.qty - Available quantity
 * @property {Array<string>} [categories] - Array of category paths
 */

/**
 * @typedef {Object} CategoryMap
 * @property {string} id - Category ID
 * @property {string} name - Category name
 * @property {string} path - Full category path
 * @property {Array<string>} breadcrumbs - Category breadcrumb trail
 */

/**
 * @typedef {Object} StorageResult
 * @property {string} fileName - Name of the stored file
 * @property {string} downloadUrl - URL to download the file
 */

/**
 * @typedef {Object} SuccessResponse
 * @property {number} statusCode - HTTP status code (200)
 * @property {Object} body - Response body
 * @property {boolean} body.success - Success indicator
 * @property {string} body.message - Success message
 * @property {Object} [body.file] - File information (production only)
 * @property {string} body.file.downloadUrl - Download URL for the file
 * @property {Array<string>} body.steps - Processing steps executed
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {number} statusCode - HTTP status code (4xx or 5xx)
 * @property {Object} body - Response body
 * @property {string} body.error - Error message
 * @property {string} [body.details] - Error details (development only)
 * @property {Array<string>} body.steps - Processing steps before error
 */

const { Core } = require('@adobe/aio-sdk');
const { extractActionParams } = require('../../core/http');
const ResponseHandler = require('../../core/response-handler');
const { getAuthToken } = require('./lib/auth');
const { fetchAllProducts, enrichWithInventory } = require('./lib/api/products');
const { buildCategoryMap } = require('./lib/api/categories');
const { buildProductObject, DEFAULT_FIELDS } = require('./lib/product-transformer');
const { performance } = require('perf_hooks');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');

/**
 * Main action handler for get-products
 * @param {Object} rawParams - Raw action parameters from OpenWhisk
 * @param {ActionParams} rawParams.params - Extracted action parameters
 * @returns {Promise<SuccessResponse|ErrorResponse>} Action response
 */
async function main(rawParams) {
  const logger = Core.Logger('main', { level: rawParams.LOG_LEVEL || 'info' });
  const startTime = performance.now();
  const memoryUsage = {};
  
  // Extract parameters and initialize response handler
  const params = extractActionParams(rawParams);
  const isDev = (rawParams.__ow_query && rawParams.__ow_query.env === 'dev') || rawParams.env === 'dev';
  const responseHandler = new ResponseHandler({ isDev, logger });
  
  try {
    // Record initial memory usage
    memoryUsage.start = process.memoryUsage().heapUsed;

    // Step 1: Get authentication token
    const token = await getAuthToken(params);
    responseHandler.addStep('Authentication successful');

    // Step 2: Fetch products with pagination
    const products = await fetchAllProducts(token, params);
    responseHandler.addStep(`Fetched ${products.length} products from Adobe Commerce`);

    // Record memory after product fetch
    memoryUsage.afterFetch = process.memoryUsage().heapUsed;

    // Step 3: Enrich with inventory data
    const productsWithInventory = await enrichWithInventory(products, token, params);
    responseHandler.addStep(`Enriched ${productsWithInventory.length} products with inventory data`);

    // Step 4: Build category map and enrich products
    const categoryMap = await buildCategoryMap(productsWithInventory, token, params);
    responseHandler.addStep(`Built category map with ${Object.keys(categoryMap).length} categories`);

    // Step 5: Transform products
    const transformedProducts = productsWithInventory.map(product => 
      buildProductObject(product, DEFAULT_FIELDS, categoryMap)
    );
    responseHandler.addStep(`Transformed ${transformedProducts.length} products`);

    // Record memory after transformation
    memoryUsage.afterTransform = process.memoryUsage().heapUsed;

    // Skip file operations in development mode
    if (responseHandler.shouldSkipFileOperations()) {
      // Log memory usage in development mode
      if (isDev) {
        const memoryStats = Object.entries(memoryUsage).map(([stage, bytes]) => 
          `${stage}: ${(bytes / 1024 / 1024).toFixed(1)}MB`
        ).join(', ');
        logger.info(`Memory usage - ${memoryStats}`);
      }
      return responseHandler.success();
    }

    // Step 6: Generate compressed CSV file
    const csvResult = await createCsv(transformedProducts);
    responseHandler.addStep(`Generated compressed CSV content (${csvResult.stats.savingsPercent} size reduction)`);

    // Record memory after CSV generation
    memoryUsage.afterCsv = process.memoryUsage().heapUsed;

    // Step 7: Store CSV file
    const storageResult = await storeCsv(csvResult);
    responseHandler.addStep(`Stored compressed CSV file as "${storageResult.fileName}"`);

    // Calculate execution time
    const executionTime = ((performance.now() - startTime) / 1000).toFixed(1);
    logger.info(`Execution completed in ${executionTime}s`);

    // Log final memory usage
    const finalMemory = process.memoryUsage().heapUsed;
    const peakMemory = Math.max(...Object.values(memoryUsage), finalMemory);
    
    // Format memory metrics for response
    const memoryMetrics = {
      start: `${(memoryUsage.start / 1024 / 1024).toFixed(1)}MB`,
      afterFetch: `${(memoryUsage.afterFetch / 1024 / 1024).toFixed(1)}MB`,
      afterTransform: `${(memoryUsage.afterTransform / 1024 / 1024).toFixed(1)}MB`,
      afterCsv: `${(memoryUsage.afterCsv / 1024 / 1024).toFixed(1)}MB`,
      peak: `${(peakMemory / 1024 / 1024).toFixed(1)}MB`
    };

    // Always include performance metrics in response
    const response = {
      file: isDev ? null : { downloadUrl: storageResult.downloadUrl },
      message: "Product export completed successfully.",
      steps: responseHandler.steps,
      performance: {
        executionTime: `${executionTime}s`,
        compression: csvResult ? csvResult.stats : null,
        memory: memoryMetrics,
        productCount: products.length,
        categoryCount: Object.keys(categoryMap).length
      }
    };

    return responseHandler.success(response);
  } catch (error) {
    return responseHandler.error(error);
  }
}

exports.main = main;
