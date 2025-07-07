/**
 * Products Domain - Validate Module
 *
 * Consolidates all product validation functionality.
 * Following functional composition principles with pure functions
 * and clear input/output contracts.
 *
 * Migrated from:
 * - actions/backend/get-products/steps/validateInput.js
 * - src/commerce/data/product.js
 */

const { loadConfig } = require('../../config');
const { checkMissingParams } = require('../shared');

/**
 * Product fields configuration
 * @constant {Array<string>}
 */
const PRODUCT_FIELDS = ['sku', 'name', 'price', 'qty', 'categories', 'images'];

/**
 * Validates the input parameters for product actions
 * Pure function that checks required OAuth credentials and configuration.
 *
 * @param {Object} params - Action parameters
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  // Validate OAuth 1.0 credentials as parameters
  const requiredParams = [
    'COMMERCE_CONSUMER_KEY',
    'COMMERCE_CONSUMER_SECRET',
    'COMMERCE_ACCESS_TOKEN',
    'COMMERCE_ACCESS_TOKEN_SECRET',
  ];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  // Validate Commerce URL from configuration
  try {
    const config = loadConfig(params);
    const commerceUrl = config.commerce.baseUrl;

    if (!commerceUrl) {
      throw new Error('Commerce URL not configured in environment');
    }

    // Validate URL format
    new URL(commerceUrl);
  } catch (error) {
    throw new Error(`Invalid Commerce configuration: ${error.message}`);
  }

  // OAuth credentials will be validated when the first API call is made
}

/**
 * Gets product fields with parameter support
 * Pure function that returns configured product fields.
 *
 * @param {Object} [params] - Action parameters
 * @returns {Array} Product fields array
 */
function getProductFields(params = {}) {
  const config = loadConfig(params);
  return config.products?.fields || PRODUCT_FIELDS;
}

/**
 * Validates product data against configuration rules
 * Pure function that checks product data integrity.
 *
 * @param {Object} product - Product data to validate
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Validation result with any errors
 */
function validateProduct(product, params = {}) {
  const errors = [];
  const config = loadConfig(params);
  const VALIDATION_RULES = config.products?.validation || {};

  // Check required fields (sku and name are always required)
  if (!product.sku) {
    errors.push('Missing required field: sku');
  }
  if (!product.name) {
    errors.push('Missing required field: name');
  }

  // Validate field values against rules
  Object.entries(VALIDATION_RULES).forEach(([field, rules]) => {
    if (product[field]) {
      if (rules.pattern && !new RegExp(rules.pattern).test(product[field])) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.minLength && product[field].length < rules.minLength) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.maxLength && product[field].length > rules.maxLength) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.min !== undefined && product[field] < rules.min) {
        errors.push(`${field}: ${rules.message}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the list of fields to include in the response
 * Pure function that validates and returns requested fields.
 *
 * @param {Object} params - Request parameters
 * @param {Array<string>} [params.fields] - Optional array of field names to include
 * @returns {Array<string>} Array of field names to include
 */
function getRequestedFields(params) {
  const availableFields = getProductFields(params);

  if (!Array.isArray(params.fields) || params.fields.length === 0) {
    return availableFields;
  }

  // Validate that all requested fields are available
  const invalidFields = params.fields.filter((field) => !availableFields.includes(field));
  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid fields requested: ${invalidFields.join(', ')}. Available fields are: ${availableFields.join(', ')}`
    );
  }

  return params.fields;
}

/**
 * Validates an array of products
 * Pure function that validates multiple products and collects all errors.
 *
 * @param {Object[]} products - Array of product objects to validate
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Validation result with products and any errors
 */
function validateProductData(products, params = {}) {
  if (!Array.isArray(products)) {
    return {
      isValid: false,
      errors: ['Products must be an array'],
      validProducts: [],
      invalidProducts: [],
    };
  }

  const validProducts = [];
  const invalidProducts = [];
  const allErrors = [];

  products.forEach((product, index) => {
    const validation = validateProduct(product, params);

    if (validation.isValid) {
      validProducts.push(product);
    } else {
      invalidProducts.push({
        index,
        product,
        errors: validation.errors,
      });
      allErrors.push(`Product ${index}: ${validation.errors.join(', ')}`);
    }
  });

  return {
    isValid: invalidProducts.length === 0,
    errors: allErrors,
    validProducts,
    invalidProducts,
    stats: {
      total: products.length,
      valid: validProducts.length,
      invalid: invalidProducts.length,
    },
  };
}

/**
 * Validates product configuration parameters
 * Pure function that checks if product-related configuration is valid.
 *
 * @param {Object} config - Configuration object
 * @returns {Object} Configuration validation result
 */
function validateProductConfig(config) {
  const errors = [];

  if (!config.products) {
    errors.push('Missing products configuration');
    return { isValid: false, errors };
  }

  if (!config.products.fields || !Array.isArray(config.products.fields)) {
    errors.push('Product fields must be an array');
  }

  if (!config.products.batchSize || typeof config.products.batchSize !== 'number') {
    errors.push('Product batch size must be a number');
  }

  if (
    config.products.batchSize &&
    (config.products.batchSize < 1 || config.products.batchSize > 200)
  ) {
    errors.push('Product batch size must be between 1 and 200');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the input parameters for mesh product actions
 * Pure function that checks required OAuth and mesh configuration.
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateMeshInput(params, config) {
  // First validate basic input requirements
  await validateInput(params);

  // Validate mesh-specific configuration
  if (!config.mesh) {
    throw new Error('Mesh configuration not found');
  }

  if (!config.mesh.endpoint) {
    throw new Error('Mesh endpoint not configured');
  }

  if (!config.mesh.apiKey) {
    throw new Error('Mesh API key not configured');
  }

  // Validate admin credentials for inventory (mesh-specific requirement)
  if (!params.COMMERCE_ADMIN_USERNAME || !params.COMMERCE_ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials required for mesh inventory: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    );
  }
}

module.exports = {
  validateInput,
  validateMeshInput,
  validateProduct,
  validateProductData,
  validateProductConfig,
  getProductFields,
  getRequestedFields,
  // Constants
  PRODUCT_FIELDS,
};
