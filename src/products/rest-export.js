/**
 * Products REST Export
 * Complete REST API product export capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const { convertToCSV } = require('./rest-export/csv-generation');
const { enrichWithCategories, enrichWithInventory } = require('./rest-export/enrichment');
const { buildProducts } = require('./rest-export/transformation');
const {
  validateInput,
  getPaginationConfig,
  shouldContinuePagination,
} = require('./rest-export/validation');
const { executeAuthenticatedCommerceRequest } = require('../commerce/admin-token-auth');
const { exportCsvWithStorage } = require('../files/csv-export');

// Business Workflows

/**
 * Export products with storage and fallback handling
 * @purpose Complete export workflow with storage and error fallback
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Complete configuration object
 * @returns {Promise<Object>} Export result with storage info and fallback handling
 * @throws {Error} When Commerce API is unavailable or data is invalid
 * @usedBy get-products action
 * @config commerce.baseUrl, commerce.credentials, storage.provider, products.fields
 */
async function exportProductsWithStorageAndFallback(params, config) {
  try {
    // Step 1: Validate input parameters and configuration
    await validateInput(params, config);

    // Step 2: Execute main export workflow
    const exportResult = await exportProductsWithStorage(params, config);

    return {
      ...exportResult,
      fallback: false,
      method: 'primary-export',
    };
  } catch (error) {
    // Step 3: Return error with context for higher-level fallback handling
    throw new Error(`Product export with storage failed: ${error.message}`);
  }
}

/**
 * Export products with storage
 * @purpose Product export workflow with storage integration
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Complete configuration object
 * @returns {Promise<Object>} Export result with storage info
 * @throws {Error} When export or storage fails
 * @usedBy exportProductsWithStorageAndFallback
 * @config commerce.baseUrl, commerce.credentials, storage.provider, products.fields
 */
async function exportProductsWithStorage(params, config) {
  // Step 1: Execute core export workflow
  const exportResult = await exportProducts(params, config);

  // Step 2: Store CSV with configured storage provider
  const storageResult = await exportCsvWithStorage(
    exportResult.csvContent,
    config,
    params,
    undefined,
    { useCase: params.useCase }
  );

  return {
    productCount: exportResult.productCount,
    csvSize: exportResult.csvSize,
    storageResult,
  };
}

/**
 * Export products as CSV
 * @purpose Core product export functionality with REST API integration
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Complete configuration object
 * @returns {Promise<Object>} CSV export result with product data
 * @throws {Error} When Commerce API is unavailable or data is invalid
 * @usedBy exportProductsWithStorage
 * @config commerce.baseUrl, commerce.credentials, products.fields
 */
async function exportProducts(params, config) {
  // Step 1: Fetch and enrich products from Commerce API
  const enrichedProducts = await fetchAndEnrichProducts(params, config);

  // Step 2: Transform products for export format
  const builtProducts = await buildProducts(enrichedProducts, config);

  // Step 3: Convert to CSV format
  const csvResult = await convertToCSV(builtProducts);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    csvContent: csvResult,
  };
}

// Feature Operations

/**
 * Fetch and enrich products with all data (categories and inventory)
 * @purpose Orchestrate complete product data retrieval and enrichment
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @returns {Promise<Array>} Array of fully enriched product objects
 * @throws {Error} If Commerce URL is missing, authentication fails, or API errors occur
 * @usedBy exportProducts
 * @config commerce.baseUrl, commerce.credentials, products.fields
 */
async function fetchAndEnrichProducts(params, config) {
  try {
    // Step 1: Fetch base product data
    const products = await fetchProducts(params, config);

    // Step 2: Enrich with categories first, then inventory
    const categorizedProducts = await enrichWithCategories(products, config, params);
    const fullyEnrichedProducts = await enrichWithInventory(categorizedProducts, config, params);

    return fullyEnrichedProducts;
  } catch (error) {
    throw new Error(`Product fetch and enrichment failed: ${error.message}`);
  }
}

/**
 * Fetch products from Commerce REST API with pagination
 * @purpose Retrieve all products using pagination with rate limiting
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of product objects from Commerce API
 * @throws {Error} When Commerce API is unavailable or returns errors
 * @usedBy fetchAndEnrichProducts
 * @config commerce.baseUrl, products.pagination
 */
async function fetchProducts(params, config) {
  const allProducts = [];
  const { pageSize, maxPages } = getPaginationConfig(config);
  let currentPage = 1;

  try {
    while (currentPage <= maxPages) {
      // Step 1: Make API request using proper query building
      const query = {
        'searchCriteria[pageSize]': pageSize,
        'searchCriteria[currentPage]': currentPage,
      };
      const response = await executeAuthenticatedCommerceRequest(
        'products',
        { method: 'GET', query },
        config,
        params
      );

      // Step 2: Process response - Commerce API returns response.body.items
      if (response && response.body && response.body.items && Array.isArray(response.body.items)) {
        allProducts.push(...response.body.items);

        // Step 3: Check if we should continue pagination
        if (!shouldContinuePagination(response.body, currentPage, pageSize, maxPages)) {
          break;
        }
      } else {
        console.warn(`No items in Commerce API response for page ${currentPage}:`, response);
        break;
      }

      currentPage++;
    }

    console.info(`Fetched ${allProducts.length} products from Commerce API`);
    return allProducts;
  } catch (error) {
    throw new Error(`Product fetching failed: ${error.message}`);
  }
}

module.exports = {
  // Business workflows
  exportProductsWithStorageAndFallback,
  exportProductsWithStorage,
  exportProducts,

  // Feature operations
  fetchAndEnrichProducts,
  fetchProducts,
};
