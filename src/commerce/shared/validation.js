/**
 * Commerce Shared Validation Utilities
 * Validation functions shared across 3+ features in the commerce domain
 *
 * Consolidated from utils/data-validation.js and product-fetching/data-processing.js
 */

// Import validation functions from shared infrastructure
const { validateProduct } = require('../../shared/validation/product');

/**
 * Validates an array of products for commerce operations
 * @purpose Comprehensive product validation for commerce API operations
 * @param {Object[]} products - Array of product objects to validate
 * @param {Object} config - Configuration object with validation settings
 * @returns {Object} Detailed validation result with counts and errors
 * @usedBy product-fetching, data-transformation, admin-token-auth (3+ features)
 */
function validateProducts(products, config) {
  if (!Array.isArray(products)) {
    return {
      isValid: false,
      errors: ['Products must be an array'],
      validCount: 0,
      invalidCount: 0,
      totalCount: 0,
    };
  }

  const results = products.map((product, index) => {
    const validation = validateProduct(product, config);
    return {
      ...validation,
      index,
      product,
    };
  });

  const errors = results.filter((result) => !result.isValid);
  const allErrors = errors.flatMap((result) =>
    result.errors.map((error) => `Product ${result.index}: ${error}`)
  );

  return {
    isValid: errors.length === 0,
    validCount: results.length - errors.length,
    invalidCount: errors.length,
    totalCount: results.length,
    errors: allErrors,
  };
}

/**
 * Validate required product fields for commerce operations
 * @purpose Check that product objects have required fields for commerce processing
 * @param {Object} product - Product object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result with detailed errors
 * @usedBy Multiple commerce features for field validation
 */
function validateRequiredFields(product, requiredFields = ['sku', 'name']) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    return {
      isValid: false,
      errors: ['Product must be an object'],
      missingFields: requiredFields,
    };
  }

  const missingFields = [];
  requiredFields.forEach((field) => {
    if (!product[field] || product[field] === '') {
      errors.push(`Missing required field: ${field}`);
      missingFields.push(field);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
    validatedFields: requiredFields.filter((field) => !missingFields.includes(field)),
  };
}

/**
 * Validate a price field value
 * @purpose Check if a price value is valid (non-negative number)
 * @param {*} value - Price value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} Error message or null if valid
 */
function validatePriceField(value, fieldName) {
  if (value === undefined || value === null) {
    return null; // Optional fields are valid when not provided
  }

  const price = parseFloat(value);
  if (isNaN(price) || price < 0) {
    return `Product ${fieldName} must be a valid non-negative number`;
  }

  return null;
}

/**
 * Validate product pricing data
 * @purpose Ensure product pricing data is valid for commerce operations
 * @param {Object} product - Product object with pricing data
 * @returns {Object} Validation result for pricing
 * @usedBy Commerce features handling pricing
 */
function validateProductPricing(product) {
  if (!product || typeof product !== 'object') {
    return { isValid: false, errors: ['Product must be an object'] };
  }

  const errors = [];

  // Validate price field
  const priceError = validatePriceField(product.price, 'price');
  if (priceError) {
    errors.push(priceError);
  }

  // Validate special price field
  const specialPriceError = validatePriceField(product.special_price, 'special_price');
  if (specialPriceError) {
    errors.push(specialPriceError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extracts category IDs from a product object
 * @purpose Extract category identifiers from various Commerce product formats
 * @param {Object} product - Product object
 * @returns {Array<string>} Array of category IDs as strings
 * @usedBy data-transformation, response-processors (3+ features)
 */
function getCategoryIds(product) {
  if (!product) return [];

  // Handle direct categories array
  if (Array.isArray(product.categories)) {
    return product.categories
      .map((category) => {
        if (typeof category === 'object' && category.id) {
          return String(category.id);
        }
        return String(category);
      })
      .filter(Boolean);
  }

  // Handle custom_attributes format
  if (Array.isArray(product.custom_attributes)) {
    const categoryAttr = product.custom_attributes.find(
      (attr) => attr.attribute_code === 'category_ids'
    );
    if (categoryAttr && Array.isArray(categoryAttr.value)) {
      return categoryAttr.value.map((id) => String(id));
    }
  }

  // Handle category_ids field directly
  if (Array.isArray(product.category_ids)) {
    return product.category_ids.map((id) => String(id));
  }

  return [];
}

module.exports = {
  validateProducts,
  validateRequiredFields,
  validateProductPricing,
  getCategoryIds,
};
