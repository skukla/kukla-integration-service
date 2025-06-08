/**
 * Core validation utilities for data handling
 * @module core/data/validation
 */

/**
 * Checks for missing required parameters in the request
 * @param {Object} params - Request parameters
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @param {Array<string>} [requiredHeaders] - Array of required header names
 * @returns {string|null} Error message if validation fails, null if successful
 */
function checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
  const missingParams = [];
  const missingHeaders = [];

  // Check for missing parameters
  requiredParams.forEach((param) => {
    const value = param.split('.').reduce((obj, key) => obj && obj[key], params);
    if (value === undefined || value === '') {
      missingParams.push(param);
    }
  });

  // Check for missing headers
  if (requiredHeaders.length > 0 && !params.__ow_headers) {
    missingHeaders.push(...requiredHeaders);
  } else {
    requiredHeaders.forEach((header) => {
      if (!params.__ow_headers[header]) {
        missingHeaders.push(header);
      }
    });
  }

  if (missingParams.length > 0 && missingHeaders.length > 0) {
    return `missing header(s) '${missingHeaders.join(',')}' and missing parameter(s) '${missingParams.join(',')}'`;
  }
  if (missingParams.length > 0) {
    return `missing parameter(s) '${missingParams.join(',')}'`;
  }
  if (missingHeaders.length > 0) {
    return `missing header(s) '${missingHeaders.join(',')}'`;
  }
  return null;
}

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
  checkMissingRequestInputs,
  validateRequired,
  validateString,
  validateUrl,
};
