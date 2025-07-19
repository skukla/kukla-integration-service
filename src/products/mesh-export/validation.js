/**
 * Mesh Export - Validation Sub-module
 * All validation utilities for API Mesh export
 */

// Sub-module specific imports (can import from utils, not from sibling sub-modules)
const { checkMissingParams } = require('../../shared/validation/parameters');

// Validation Workflows

/**
 * Validate mesh input parameters and configuration
 * @purpose Comprehensive validation of all required inputs for mesh export
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<void>} Resolves if validation passes
 * @throws {Error} When validation fails with specific error message
 * @usedBy exportMeshProductsWithStorageAndFallback in mesh-export.js
 */
async function validateMeshInput(params, config) {
  // Step 1: Validate required parameters
  const requiredParams = ['MESH_API_KEY'];
  checkMissingParams(params, requiredParams);

  // Step 2: Validate mesh configuration
  validateMeshConfig(config);

  // Step 3: Validate API key format
  validateApiKey(params.MESH_API_KEY);
}

// Validation Utilities

/**
 * Validate API Mesh configuration
 * @purpose Ensure API Mesh settings are valid and complete
 * @param {Object} config - Configuration object
 * @returns {void}
 * @throws {Error} When configuration is invalid
 * @usedBy validateMeshInput
 */
function validateMeshConfig(config) {
  if (!config.mesh) {
    throw new Error('API Mesh configuration is required');
  }

  if (!config.mesh.endpoint) {
    throw new Error('API Mesh endpoint is required');
  }

  // Validate endpoint URL format
  try {
    new URL(config.mesh.endpoint);
  } catch (error) {
    throw new Error('API Mesh endpoint must be a valid URL');
  }

  // Validate timeout if provided
  if (config.mesh.timeout && (config.mesh.timeout < 5000 || config.mesh.timeout > 60000)) {
    throw new Error('API Mesh timeout must be between 5000ms and 60000ms');
  }
}

/**
 * Validate API key format
 * @purpose Check if API key has expected format and characteristics
 * @param {string} apiKey - API key to validate
 * @returns {void}
 * @throws {Error} When API key is invalid
 * @usedBy validateMeshInput
 */
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key must be a non-empty string');
  }

  if (apiKey.length < 10) {
    throw new Error('API key appears to be too short');
  }

  // Check for common API key patterns
  if (apiKey.toLowerCase().includes('example') || apiKey.toLowerCase().includes('demo')) {
    throw new Error('API key appears to be a placeholder or example value');
  }
}

/**
 * Validate mesh response data structure
 * @purpose Check if mesh response contains expected product data
 * @param {Object} response - Response from API Mesh
 * @returns {void}
 * @throws {Error} When response structure is invalid
 * @usedBy Response validation in mesh workflows
 */
function validateMeshResponseData(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Mesh response must be an object');
  }

  if (!response.mesh_products_enriched) {
    throw new Error('Mesh response missing mesh_products_enriched data');
  }

  if (!Array.isArray(response.mesh_products_enriched.products)) {
    throw new Error('Mesh response products must be an array');
  }

  const products = response.mesh_products_enriched.products;

  if (products.length === 0) {
    console.warn('Mesh response contains no products');
    return;
  }

  // Validate first product has required fields
  const firstProduct = products[0];
  const requiredFields = ['sku', 'name'];

  for (const field of requiredFields) {
    if (!firstProduct[field]) {
      throw new Error(`Product missing required field: ${field}`);
    }
  }
}

/**
 * Validate product data for export
 * @purpose Check if product data is suitable for CSV export
 * @param {Array} products - Array of product objects
 * @returns {void}
 * @throws {Error} When product data is invalid
 * @usedBy Product processing in mesh export
 */
function validateProductsForExport(products) {
  if (!Array.isArray(products)) {
    throw new Error('Products must be an array');
  }

  if (products.length === 0) {
    throw new Error('No products available for export');
  }

  if (products.length > 10000) {
    throw new Error('Too many products for export (maximum 10,000)');
  }

  // Check for duplicate SKUs
  const skus = new Set();
  const duplicates = [];

  products.forEach((product, index) => {
    if (!product.sku) {
      throw new Error(`Product at index ${index} missing SKU`);
    }

    if (skus.has(product.sku)) {
      duplicates.push(product.sku);
    } else {
      skus.add(product.sku);
    }
  });

  if (duplicates.length > 0) {
    throw new Error(`Duplicate SKUs found: ${duplicates.join(', ')}`);
  }
}

/**
 * Validate sort parameters
 * @purpose Check if sort options are valid
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {void}
 * @throws {Error} When sort parameters are invalid
 * @usedBy Product sorting validation
 */
function validateSortParameters(sortBy, sortOrder) {
  const validSortFields = ['sku', 'name', 'price', 'created_at', 'updated_at'];
  const validSortOrders = ['asc', 'desc'];

  if (sortBy && !validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}. Valid options: ${validSortFields.join(', ')}`);
  }

  if (sortOrder && !validSortOrders.includes(sortOrder.toLowerCase())) {
    throw new Error(
      `Invalid sort order: ${sortOrder}. Valid options: ${validSortOrders.join(', ')}`
    );
  }
}

module.exports = {
  // Workflows
  validateMeshInput,

  // Utilities
  validateMeshConfig,
  validateApiKey,
  validateMeshResponseData,
  validateProductsForExport,
  validateSortParameters,
};
