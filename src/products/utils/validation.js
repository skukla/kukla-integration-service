/**
 * Products Validation Utilities
 *
 * Product-domain-specific validation functions.
 * Generic validation functions moved to core domain to eliminate circular dependencies.
 */

// Import generic validation functions from core domain
const {
  getProductFields,
  validateProduct,
  getRequestedFields,
  validateProductConfig,
  DEFAULT_PRODUCT_FIELDS,
} = require('../../core/validation/operations/product');

/**
 * Validates an array of products
 * Pure function that validates multiple products and collects all errors.
 *
 * @param {Object[]} products - Array of product objects to validate
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result with products and any errors
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

module.exports = {
  // Re-export generic functions from core domain for backward compatibility
  validateProduct,
  validateProductConfig,
  getProductFields,
  getRequestedFields,

  // Product-domain-specific functions
  validateProductData,

  // Constants (re-exported from core)
  DEFAULT_PRODUCT_FIELDS,
};
