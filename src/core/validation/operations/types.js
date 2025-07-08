/**
 * Type validation operations
 * @module core/validation/operations/types
 */

/**
 * Validates required fields in an object
 * @param {Object} input - Input object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @throws {Error} If any required field is missing
 */
function validateRequired(input, requiredFields) {
  const missing = requiredFields.filter((field) => !input[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validates that a value is a non-empty string
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {Error} If value is not a non-empty string
 */
function validateString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

/**
 * Validates that a value is a valid URL
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {Error} If value is not a valid URL
 */
function validateUrl(value, fieldName) {
  try {
    new URL(value);
  } catch (error) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

module.exports = {
  validateRequired,
  validateString,
  validateUrl,
};
