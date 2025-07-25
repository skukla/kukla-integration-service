/**
 * Product validation operations
 * @module core/validation/operations/product
 *
 * Generic product validation utilities used across domains.
 * Extracted from products domain to eliminate circular dependencies.
 */

/**
 * Default product fields (fallback for compatibility)
 * @constant {Array<string>}
 */
const DEFAULT_PRODUCT_FIELDS = ['sku', 'name', 'price', 'qty', 'categories', 'images'];

/**
 * Gets product fields with configuration support
 * Pure function that returns configured product fields.
 *
 * @param {Object} config - Configuration object
 * @returns {Array} Product fields array
 */
function getProductFields(config) {
  // Use main config export fields for final output, with fallback to products config
  return config.main?.exportFields || config.products?.fields || DEFAULT_PRODUCT_FIELDS;
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
  getProductFields,
  validateProduct,
  getRequestedFields,
  validateProductConfig,
  // Constants
  DEFAULT_PRODUCT_FIELDS,
};
