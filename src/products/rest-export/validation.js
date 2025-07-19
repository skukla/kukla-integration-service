/**
 * REST Export - Validation Sub-module
 * All validation utilities for REST API export
 */

// Sub-module specific imports (can import from utils, not from sibling sub-modules)
const { createUrlBuilders } = require('../../shared/routing/url-factory');

// Validation Workflows

/**
 * Validate input parameters for REST export
 * @purpose Validate all input parameters for product export
 * @param {Object} params - Input parameters to validate
 * @param {Object} config - Configuration object
 * @throws {Error} When validation fails
 * @usedBy exportProducts in rest-export.js
 */
async function validateInput(params, config) {
  // Step 1: Validate Commerce API configuration (includes base URL check)
  validateCommerceApiConfig(config);

  // Step 2: Validate product fetch configuration
  validateProductFetchConfig(config);
}

// Validation Utilities

/**
 * Validate product fetch configuration
 * @purpose Ensure all required configuration is present for product fetching
 * @param {Object} config - Configuration object
 * @returns {void}
 * @throws {Error} When product fetch configuration is invalid
 * @usedBy validateInput
 */
function validateProductFetchConfig(config) {
  validateCommerceBaseConfig(config);
  validateProductPaginationConfig(config);
}

/**
 * Validate basic Commerce configuration
 * @purpose Ensure Commerce base configuration is present
 * @param {Object} config - Configuration object
 * @returns {void}
 * @throws {Error} When Commerce base configuration is invalid
 * @usedBy validateProductFetchConfig
 */
function validateCommerceBaseConfig(config) {
  if (!config.commerce || !config.commerce.baseUrl) {
    throw new Error('Commerce configuration is required for product fetching');
  }
}

/**
 * Validate product pagination configuration
 * @purpose Ensure pagination settings are valid
 * @param {Object} config - Configuration object
 * @returns {void}
 * @throws {Error} When pagination configuration is invalid
 * @usedBy validateProductFetchConfig
 */
function validateProductPaginationConfig(config) {
  if (!config.products || !config.products.pagination) {
    throw new Error('Products pagination configuration is required');
  }

  const { pageSize, maxPages } = config.products.pagination;

  if (!pageSize || pageSize <= 0 || pageSize > 500) {
    throw new Error('Products page size must be between 1 and 500');
  }

  if (!maxPages || maxPages <= 0 || maxPages > 100) {
    throw new Error('Products max pages must be between 1 and 100');
  }
}

/**
 * Validate Commerce API configuration
 * @purpose Ensure Commerce API settings are valid for requests
 * @param {Object} config - Configuration object
 * @returns {void}
 * @throws {Error} When Commerce API configuration is invalid
 * @usedBy validateInput
 */
function validateCommerceApiConfig(config) {
  // Validate base URL is configured
  if (!config.commerce.baseUrl) {
    throw new Error('Commerce base URL is required - set COMMERCE_BASE_URL environment variable');
  }

  if (config.commerce.baseUrl.startsWith('REQUIRED:')) {
    throw new Error(
      'Commerce base URL not configured - set COMMERCE_BASE_URL environment variable'
    );
  }

  // Validate API configuration
  if (!config.commerce.api || !config.commerce.api.timeout) {
    throw new Error('Commerce API timeout configuration is required');
  }

  const timeout = config.commerce.api.timeout;
  if (timeout < 5000 || timeout > 60000) {
    throw new Error('Commerce API timeout must be between 5000ms and 60000ms');
  }
}

/**
 * Get pagination configuration with validation
 * @purpose Extract and validate pagination settings from configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validated pagination configuration
 * @throws {Error} When pagination configuration is invalid
 * @usedBy fetchProducts functions
 */
function getPaginationConfig(config) {
  const pagination = config.products.pagination;

  if (!pagination) {
    throw new Error('Pagination configuration is required');
  }

  return {
    pageSize: pagination.pageSize,
    maxPages: pagination.maxPages,
  };
}

/**
 * Validate pagination continuation
 * @purpose Determine if pagination should continue based on response and limits
 * @param {Object} response - API response object
 * @param {number} currentPage - Current page number
 * @param {number} pageSize - Number of items per page
 * @param {number} maxPages - Maximum allowed pages
 * @returns {boolean} True if pagination should continue
 * @usedBy fetchProducts functions
 */
function shouldContinuePagination(response, currentPage, pageSize, maxPages) {
  // Stop if we've reached max pages
  if (currentPage >= maxPages) {
    return false;
  }

  // Stop if response is empty or doesn't contain items
  if (!response || !Array.isArray(response.items)) {
    return false;
  }

  // Stop if we got fewer items than page size (last page)
  if (response.items.length < pageSize) {
    return false;
  }

  return true;
}

/**
 * Build products API URL with validation
 * @purpose Create valid Commerce API URL for product fetching
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number
 * @param {Object} config - Configuration object
 * @returns {string} Valid API URL for product fetching
 * @throws {Error} When URL building fails
 * @usedBy fetchProducts functions
 */
function buildProductsApiUrl(pageSize, currentPage, config) {
  try {
    const { commerceUrl } = createUrlBuilders(config);
    return commerceUrl('products', { pageSize, currentPage });
  } catch (error) {
    throw new Error(`Failed to build products API URL: ${error.message}`);
  }
}

module.exports = {
  // Workflows (used by feature core)
  validateInput,

  // Utilities (available for testing/extension)
  validateProductFetchConfig,
  validateCommerceApiConfig,
  getPaginationConfig,
  shouldContinuePagination,
  buildProductsApiUrl,
};
