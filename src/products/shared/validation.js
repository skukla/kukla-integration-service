/**
 * Products Shared Validation Utilities
 * Validation functions shared across 3+ features in the products domain
 *
 * Consolidated from utils/validation.js and operations/validation.js
 */

// Import generic validation functions from shared infrastructure
const {
  getProductFields,
  validateProduct,
  getRequestedFields,
  validateProductConfig,
  DEFAULT_PRODUCT_FIELDS,
} = require('../../shared/validation/product');

/**
 * Validates an array of products
 * @purpose Validate multiple products and collect all errors for batch processing
 * @param {Object[]} products - Array of product objects to validate
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result with products and any errors
 * @usedBy rest-export, mesh-export, product-enrichment (3+ features)
 */
function validateProductData(products, config) {
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
    const validation = validateProduct(product, config);

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
 * Validate required product fields
 * @purpose Check that product objects have required fields for export
 * @param {Object} product - Product object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 * @usedBy Multiple product features for field validation
 */
function validateRequiredProductFields(product, requiredFields = ['sku', 'name']) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    return { isValid: false, errors: ['Product must be an object'] };
  }

  requiredFields.forEach((field) => {
    if (!product[field] || product[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  // Re-export generic functions from shared infrastructure for convenience
  validateProduct,
  validateProductConfig,
  getProductFields,
  getRequestedFields,
  DEFAULT_PRODUCT_FIELDS,

  // Products domain-specific validation functions
  validateProductData,
  validateRequiredProductFields,
};
