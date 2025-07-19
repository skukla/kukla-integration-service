/**
 * Product Fetching - Data Processing Sub-module
 * All product normalization, validation, and response building utilities
 */

// Import from commerce domain shared utilities
const { normalizeProducts } = require('../shared/normalization');
const { validateProducts } = require('../shared/validation');

// Data Processing Workflows

/**
 * Process product results with normalization and validation
 * @purpose Process raw Commerce API product data with normalization, validation, and metadata
 * @param {Object} rawData - Raw Commerce API response data
 * @param {Object} config - Configuration object
 * @param {Object} [options={}] - Processing options
 * @returns {Promise<Object>} Processed product data with validation and metadata
 * @usedBy fetchProductsWithPagination
 */
async function processProductResults(rawData, config, options = {}) {
  const { products, totalCount, searchCriteria, rawResponse } = rawData;

  // Step 1: Normalize product data
  const normalizedProducts = normalizeProducts(products);

  // Step 2: Validate product data
  const validation = validateProducts(normalizedProducts, config);

  // Step 3: Apply processing filters if requested
  const filteredProducts = options.applyFilters
    ? applyProductFilters(normalizedProducts, options.filters || {})
    : normalizedProducts;

  return {
    products: filteredProducts,
    totalCount,
    searchCriteria,
    validation,
    processing: {
      normalizedCount: normalizedProducts.length,
      filteredCount: filteredProducts.length,
      processedAt: new Date().toISOString(),
    },
    rawResponse: options.includeRawResponse ? rawResponse : undefined,
  };
}

// Data Processing Utilities

/**
 * Normalize product data
 * @purpose Normalize product data to consistent format
 * @param {Array} products - Raw product data array
 * @returns {Array} Normalized product data
 * @usedBy processProductResults
 */

/**
 * Apply product filters
 * @purpose Apply post-processing filters to product data
 * @param {Array} products - Normalized product data
 * @param {Object} filters - Filter criteria to apply
 * @returns {Array} Filtered product data
 * @usedBy processProductResults
 */
function applyProductFilters(products, filters) {
  let filteredProducts = [...products];

  // Filter by status
  if (filters.status !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.status === filters.status);
  }

  // Filter by minimum price
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price >= filters.minPrice);
  }

  // Filter by maximum price
  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter((product) => product.price <= filters.maxPrice);
  }

  // Filter by category inclusion
  if (filters.categoryIds && Array.isArray(filters.categoryIds)) {
    filteredProducts = filteredProducts.filter((product) =>
      product.category_ids.some((catId) => filters.categoryIds.includes(catId))
    );
  }

  return filteredProducts;
}

/**
 * Build product fetch response
 * @purpose Create standardized response for product fetching operations
 * @param {Object} processedData - Processed product data
 * @param {Object} query - Original query parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Standardized product fetch response
 * @usedBy fetchProductsWithPagination
 */
function buildProductFetchResponse(processedData, query, config) {
  const { products, totalCount, validation, searchCriteria, processing } = processedData;

  const pageSize =
    parseInt(query['searchCriteria[pageSize]']) || config.commerce.pagination.defaultPageSize;
  const currentPage = parseInt(query['searchCriteria[currentPage]']) || 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
    validation,
    processing,
    searchCriteria,
    metadata: {
      fetchedAt: new Date().toISOString(),
      productCount: products.length,
      queryParameters: query,
    },
  };
}

module.exports = {
  processProductResults,
  applyProductFilters,
  buildProductFetchResponse,
};
