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

// Legacy exports for backward compatibility
const validateInput = validateRequired;

module.exports = {
  // Validation utilities
  checkMissingRequestInputs,
  validateInput,
  validateRequired,
  validateString,
  validateUrl,

  // Re-export for backward compatibility
  validation: {
    checkMissingRequestInputs,
    validateInput,
    validateRequired,
    validateString,
    validateUrl,
  },
};
