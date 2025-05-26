/**
 * Step to validate input parameters
 * @module steps/validateInput
 */
const { checkMissingParams } = require('../../../../src/core/http/client');
const { createErrorResponse } = require('../../../../src/core/responses');

/**
 * Validates the input parameters for the action
 * @param {import('../index.js').ActionParams} params
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  const requiredParams = [
    'COMMERCE_URL',
    'COMMERCE_ADMIN_USERNAME',
    'COMMERCE_ADMIN_PASSWORD'
  ];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  // Validate URL format
  try {
    new URL(params.COMMERCE_URL);
  } catch (error) {
    throw new Error('Invalid COMMERCE_URL format');
  }

  // Validate optional parameters if provided
  if (params.include_inventory !== undefined && typeof params.include_inventory !== 'boolean') {
    throw new Error('include_inventory must be a boolean value');
  }

  if (params.include_categories !== undefined && typeof params.include_categories !== 'boolean') {
    throw new Error('include_categories must be a boolean value');
  }
}

module.exports = validateInput; 