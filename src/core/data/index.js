/**
 * Core data utilities
 * @module core/data
 */

const {
  checkMissingRequestInputs,
  validateRequired,
  validateString,
  validateUrl,
} = require('../validation');
const {
  formatFileSize,
  formatDate,
  formatList,
  formatMetricValue,
  transformObject,
  createObjectTransformer,
} = require('./transformation');

// Legacy exports for backward compatibility
const validateInput = validateRequired;

module.exports = {
  // Validation utilities
  checkMissingRequestInputs,
  validateInput,
  validateRequired,
  validateString,
  validateUrl,

  // Transformation utilities
  formatFileSize,
  formatDate,
  formatList,
  formatMetricValue,
  transformObject,
  createObjectTransformer,

  // Re-export for backward compatibility
  validation: {
    checkMissingRequestInputs,
    validateInput,
    validateRequired,
    validateString,
    validateUrl,
  },
};
