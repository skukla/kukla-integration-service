/**
 * Commerce Product Fetching - Feature Core
 * Complete product fetching capability - Feature Core with Sub-modules
 */

const {
  fetchProductsFromCommerce,
  fetchProductsInBatches,
} = require('./product-fetching/api-requests');
const {
  processProductResults,
  buildProductFetchResponse,
} = require('./product-fetching/data-processing');
const {
  buildProductQuery,
  buildBasicProductQuery,
  buildCriteriaQuery,
} = require('./product-fetching/query-building');

// Business Workflows

/**
 * Complete product fetching workflow with pagination and processing
 * @purpose Execute complete product fetching with pagination, validation, and data processing
 * @param {Object} query - Query parameters for product fetching (pageSize, currentPage, searchCriteria, etc.)
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} [options={}] - Fetching options including processing preferences
 * @returns {Promise<Object>} Complete product fetching result with products, pagination, and metadata
 * @throws {Error} When product fetching fails or validation errors occur
 * @usedBy get-products action, get-products-mesh action, product enrichment workflows
 */
async function fetchProductsWithPagination(query, config, params, options = {}) {
  try {
    // Step 1: Build and validate query parameters
    const validatedQuery = buildProductQuery(query, config, options);

    // Step 2: Execute paginated product fetching
    const rawProductData = await fetchProductsFromCommerce(validatedQuery, config, params);

    // Step 3: Process and validate product data
    const processedData = await processProductResults(rawProductData, config, options);

    // Step 4: Build comprehensive response with pagination metadata
    return buildProductFetchResponse(processedData, validatedQuery, config);
  } catch (error) {
    throw new Error(`Product fetching workflow failed: ${error.message}`);
  }
}

/**
 * Simple product fetching workflow
 * @purpose Fetch products with basic parameters and minimal processing
 * @param {Object} query - Basic query parameters (limit, offset, filters)
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Basic product fetching result
 * @usedBy Simple product listings, basic product operations
 */
async function fetchProducts(query, config, params) {
  try {
    // Step 1: Build basic query
    const basicQuery = buildBasicProductQuery(query, config);

    // Step 2: Fetch products from Commerce
    const rawProductData = await fetchProductsFromCommerce(basicQuery, config, params);

    // Step 3: Process with minimal validation
    const processedData = await processProductResults(rawProductData, config, {
      applyFilters: false,
      includeRawResponse: false,
    });

    return {
      products: processedData.products,
      totalCount: processedData.totalCount,
      validation: processedData.validation,
      metadata: {
        fetchedAt: new Date().toISOString(),
        productCount: processedData.products.length,
      },
    };
  } catch (error) {
    throw new Error(`Basic product fetching failed: ${error.message}`);
  }
}

/**
 * Criteria-based product fetching workflow
 * @purpose Fetch products using specific search criteria (SKUs, categories, attributes)
 * @param {Object} criteria - Specific search criteria (skus, categoryIds, attributeFilters)
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Criteria-based product fetching result
 * @usedBy Product enrichment workflows, targeted product operations
 */
async function fetchProductsByCriteria(criteria, config, params) {
  try {
    // Step 1: Build criteria-based query
    const criteriaQuery = buildCriteriaQuery(criteria, config);

    // Step 2: Fetch products using criteria
    const rawProductData = await fetchProductsFromCommerce(criteriaQuery, config, params);

    // Step 3: Process with targeted validation
    const processedData = await processProductResults(rawProductData, config, {
      applyFilters: true,
      filters: criteria.postProcessingFilters || {},
    });

    return buildProductFetchResponse(processedData, criteriaQuery, config);
  } catch (error) {
    throw new Error(`Criteria-based product fetching failed: ${error.message}`);
  }
}

module.exports = {
  // Business workflows
  fetchProductsWithPagination,
  fetchProducts,
  fetchProductsByCriteria,

  // Feature operations
  fetchProductsFromCommerce,
  processProductResults,
  fetchProductsInBatches,

  // Feature utilities
  buildProductQuery,
  buildBasicProductQuery,
  buildCriteriaQuery,
  buildProductFetchResponse,
};
