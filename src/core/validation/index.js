/**
 * Validation utilities catalog
 * @module core/validation
 *
 * Provides validation utilities organized by operational concern:
 * - Parameters: Parameter and request validation
 * - Types: Type validation utilities
 * - Product: Product validation utilities (extracted from products domain)
 */

// Import operations modules
const parameters = require('./operations/parameters');
const product = require('./operations/product');
const types = require('./operations/types');

module.exports = {
  // Export individual functions for backward compatibility
  checkMissingRequestInputs: parameters.checkMissingRequestInputs,
  checkMissingParams: parameters.checkMissingParams,
  validateRequired: types.validateRequired,
  validateString: types.validateString,
  validateUrl: types.validateUrl,

  // Export product validation functions
  getProductFields: product.getProductFields,
  validateProduct: product.validateProduct,
  getRequestedFields: product.getRequestedFields,
  validateProductConfig: product.validateProductConfig,

  // Export organized by operation type
  parameters,
  types,
  product,
};
