/**
 * Enhanced validation utilities using simplified schemas
 * @module core/validation
 */

const { getActionSchema } = require('../../../config/schema');

/**
 * Validate action parameters against schema
 * @param {string} actionName - Name of the action
 * @param {Object} params - Parameters to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.strict=false] - Whether to use strict validation
 * @throws {Error} If validation fails and strict mode is enabled
 * @returns {boolean} True if valid, false if invalid (in non-strict mode)
 */
function validateActionParams(actionName, params, options = {}) {
  const schema = getActionSchema(actionName);

  if (!schema) {
    if (options.strict) {
      throw new Error(`No schema found for action: ${actionName}`);
    }
    return true; // No schema = no validation = pass
  }

  try {
    const Ajv = require('ajv');
    const addFormats = require('ajv-formats');

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema.request);
    const valid = validate(params);

    if (!valid && options.strict) {
      throw new Error(`Action parameter validation failed: ${ajv.errorsText(validate.errors)}`);
    }

    return valid;
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    console.warn(`Validation error for action ${actionName}:`, error.message);
    return false;
  }
}

/**
 * Validate action response against schema
 * @param {string} actionName - Name of the action
 * @param {Object} response - Response to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.strict=false] - Whether to use strict validation
 * @throws {Error} If validation fails and strict mode is enabled
 * @returns {boolean} True if valid, false if invalid (in non-strict mode)
 */
function validateActionResponse(actionName, response, options = {}) {
  const schema = getActionSchema(actionName);

  if (!schema) {
    if (options.strict) {
      throw new Error(`No schema found for action: ${actionName}`);
    }
    return true;
  }

  try {
    const Ajv = require('ajv');
    const addFormats = require('ajv-formats');

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema.response);
    const valid = validate(response);

    if (!valid && options.strict) {
      throw new Error(`Action response validation failed: ${ajv.errorsText(validate.errors)}`);
    }

    return valid;
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    console.warn(`Response validation error for action ${actionName}:`, error.message);
    return false;
  }
}

/**
 * Simple validation helpers (from existing validation.js)
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
  // Schema-based validation
  validateActionParams,
  validateActionResponse,

  // Simple validation helpers
  checkMissingRequestInputs,
  validateRequired,
  validateString,
  validateUrl,
};
