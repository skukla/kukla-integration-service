/**
 * Product data configuration and validation
 * @module commerce/data/product
 */

const { createLazyConfigGetter } = require('../../core/config/lazy-loader');

/**
 * Lazy configuration getter for product configuration
 * @type {Function}
 */
const getProductConfig = createLazyConfigGetter('product-config', (config) => ({
  fields: config.commerce?.product?.fields || [],
  validation: config.commerce?.product?.validation || {},
}));

/**
 * Gets product fields with parameter support
 * @param {Object} [params] - Action parameters
 * @returns {Array} Product fields array
 */
function getProductFields(params = {}) {
  return getProductConfig(params).fields;
}

// Get default fields for backward compatibility (will use cached config)
const PRODUCT_FIELDS = getProductFields();

/**
 * Validates product data against configuration rules
 * @param {Object} product - Product data to validate
 * @returns {Object} Validation result with any errors
 */
function validateProduct(product, params = {}) {
  const errors = [];
  const { validation: VALIDATION_RULES } = getProductConfig(params);

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
 * @param {Object} params - Request parameters
 * @param {Array<string>} [params.fields] - Optional array of field names to include
 * @returns {Array<string>} Array of field names to include
 */
function getRequestedFields(params) {
  if (!Array.isArray(params.fields) || params.fields.length === 0) {
    return PRODUCT_FIELDS;
  }

  // Validate that all requested fields are available
  const invalidFields = params.fields.filter((field) => !PRODUCT_FIELDS.includes(field));
  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid fields requested: ${invalidFields.join(', ')}. Available fields are: ${PRODUCT_FIELDS.join(', ')}`
    );
  }

  return params.fields;
}

module.exports = {
  PRODUCT_FIELDS,
  validateProduct,
  getRequestedFields,
};
