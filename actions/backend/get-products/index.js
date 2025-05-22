/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
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
 * @param {Object} rawParams - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(rawParams) {
  const logger = Core.Logger('main', { level: rawParams.LOG_LEVEL || 'info' });
  const startTime = performance.now();
  
  // Extract parameters and initialize response handler
  const params = extractActionParams(rawParams);
  const isDev = (rawParams.__ow_query && rawParams.__ow_query.env === 'dev') || rawParams.env === 'dev';
  const responseHandler = new ResponseHandler({ isDev, logger });
  
  try {
    // Step 1: Get authentication token
    const token = await getAuthToken(params);
    responseHandler.addStep('Authentication successful');

    // Step 2: Fetch products with pagination
    const products = await fetchAllProducts(token, params);
    responseHandler.addStep(`Fetched ${products.length} products from Adobe Commerce`);

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

    // Skip file operations in development mode
    if (responseHandler.shouldSkipFileOperations()) {
      return responseHandler.success();
    }

    // Step 6: Generate CSV file
    const csvFile = await createCsv(transformedProducts);
    responseHandler.addStep('Generated CSV content in memory');

    // Step 7: Store CSV file
    const storageResult = await storeCsv(csvFile);
    responseHandler.addStep(`Stored CSV file as "${storageResult.fileName}"`);

    return responseHandler.success({ file: { downloadUrl: storageResult.downloadUrl } });
  } catch (error) {
    return responseHandler.error(error);
  }
}

exports.main = main;
