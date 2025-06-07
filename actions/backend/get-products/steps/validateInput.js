/**
 * Step to validate input parameters
 * @module steps/validateInput
 */
const { loadConfig } = require('../../../../config');
const { checkMissingParams } = require('../../../../src/core/http/client');

/**
 * Validates the input parameters for the action
 * @param {import('../index.js').ActionParams} params
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  // Only validate credentials as parameters - URL comes from config
  const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  // Validate Commerce URL from configuration
  try {
    const config = loadConfig(params);
    const commerceUrl = config.url?.commerce?.baseUrl;

    if (!commerceUrl) {
      throw new Error('Commerce URL not configured in environment');
    }

    // Validate URL format
    new URL(commerceUrl);
  } catch (error) {
    throw new Error(`Invalid Commerce configuration: ${error.message}`);
  }
}

module.exports = validateInput;
