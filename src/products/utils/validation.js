/**
 * Products Validation Utilities
 *
 * Low-level pure validation functions for product data.
 * Contains utilities for validating product objects, configuration, and data integrity.
 */

/**
 * Product fields configuration
 * @constant {Array<string>}
 */
const PRODUCT_FIELDS = ['sku', 'name', 'price', 'qty', 'categories', 'images'];

/**
 * Gets product fields with configuration support
 * Pure function that returns configured product fields.
 *
 * @param {Object} config - Configuration object
 * @returns {Array} Product fields array
 */
function getProductFields(config) {
  return config.products?.fields || PRODUCT_FIELDS;
}

/**
 * Validates product data against configuration rules
 * Pure function that checks product data integrity.
 *
 * @param {Object} product - Product data to validate
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result with any errors
 */
function validateProduct(product, config) {
  const errors = [];
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
 * @param {Object} config - Configuration object
 * @returns {Array<string>} Array of field names to include
 */
function getRequestedFields(params, config) {
  const availableFields = getProductFields(config);

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

module.exports = {
  validateProduct,
  validateProductData,
  validateProductConfig,
  getProductFields,
  getRequestedFields,
  // Constants
  PRODUCT_FIELDS,
};
