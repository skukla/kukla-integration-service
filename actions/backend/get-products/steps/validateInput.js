/**
 * Step to validate input parameters
 * @module steps/validateInput
 */
const { checkMissingParams } = require('../../../../src/core/http/client');

/**
 * Validates the input parameters for the action
 * @param {import('../index.js').ActionParams} params
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  const requiredParams = ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
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
}

module.exports = validateInput;
