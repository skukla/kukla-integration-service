/**
 * Products REST Export
 * Complete REST API product export capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const { enrichProductsWithAllData } = require('./product-enrichment');
const { convertToCSV } = require('./rest-export/csv-generation');
const { buildProducts } = require('./rest-export/transformation');
const { getPaginationConfig, shouldContinuePagination } = require('./rest-export/validation');
const { executeAuthenticatedCommerceRequest } = require('../commerce/admin-token-auth');
const { exportCsvWithStorage } = require('../files/csv-export');

// Business Workflows

/**
 * Export products with storage
 * @purpose Orchestrate complete product export workflow with file storage
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL and storage settings
 * @returns {Promise<Object>} Export result with product count, CSV size, and storage information
 * @throws {Error} If any step of the export process fails
 * @usedBy get-products action for complete export workflow
 * @config commerce.baseUrl, storage.provider, products.csv
 */
async function exportProductsWithStorage(params, config) {
  try {
    // Step 1: Fetch and enrich product data (includes category/inventory enrichment)
    const products = await fetchAndEnrichProducts(params, config);

    // Step 2: Transform raw Commerce data to standardized format for CSV export
    const builtProducts = buildProducts(products);

    // Step 3: Generate CSV content
    const csvContent = await convertToCSV(builtProducts, config);

    // Step 4: Store CSV file and get download URLs
    const storageResult = await exportCsvWithStorage(csvContent, config, params);

    return {
      productCount: products.length,
      csvSize: Buffer.byteLength(csvContent, 'utf8'),
      storageResult,
    };
  } catch (error) {
    throw new Error(`Product export with storage failed: ${error.message}`);
  }
}

/**
 * Export products workflow
 * @purpose Product export workflow without storage integration
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Complete configuration object
 * @returns {Promise<Object>} Export result with CSV content and metadata
 * @throws {Error} When export workflow fails
 * @usedBy exportProductsWithStorage
 * @config commerce.baseUrl, commerce.credentials, products.fields
 */
async function exportProducts(params, config) {
  try {
    // Step 1: Fetch and enrich product data (category + inventory enrichment)
    const products = await fetchAndEnrichProducts(params, config);

    // Step 2: Transform products to standardized format for CSV export
    const builtProducts = buildProducts(products);

    // Step 3: Generate CSV content with headers
    const csvContent = await convertToCSV(builtProducts, config);

    return {
      productCount: products.length,
      csvSize: Buffer.byteLength(csvContent, 'utf8'),
      csvContent: csvContent,
    };
  } catch (error) {
    throw new Error(`Product export failed: ${error.message}`);
  }
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

    // Step 2: Enrich with both categories AND inventory - fetch actual category names from API
    const enrichedProducts = await enrichProductsWithAllData(products, config, params);

    return enrichedProducts;
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
      // Step 1: Make API request - categories work in bulk, inventory needs separate calls
      const query = {
        'searchCriteria[pageSize]': pageSize,
        'searchCriteria[currentPage]': currentPage,
        // Categories work in bulk, but stock_item does NOT work in bulk calls
        fields:
          'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,media_gallery_entries[file,url,position,types],custom_attributes,extension_attributes[category_links,website_ids]],total_count',
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
  exportProductsWithStorage,
  exportProducts,
  fetchAndEnrichProducts,
  fetchProducts,
};
