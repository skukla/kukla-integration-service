/**
 * Step to validate input parameters
 * @module steps/validateInput
 */
const { loadConfig } = require('../../../../config');
const { checkMissingParams } = require('../../../../src/shared/validation');

/**
 * Validates the input parameters for the action
 * @param {import('../index.js').ActionParams} params
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  // Validate OAuth 1.0 credentials as parameters
  const requiredParams = [
    'COMMERCE_CONSUMER_KEY',
    'COMMERCE_CONSUMER_SECRET',
    'COMMERCE_ACCESS_TOKEN',
    'COMMERCE_ACCESS_TOKEN_SECRET',
  ];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  // Validate Commerce URL from configuration
  try {
    const config = loadConfig(params);
    const commerceUrl = config.commerce.baseUrl;

    if (!commerceUrl) {
      throw new Error('Commerce URL not configured in environment');
    }

    // Validate URL format
    new URL(commerceUrl);
  } catch (error) {
    throw new Error(`Invalid Commerce configuration: ${error.message}`);
  }

  // OAuth credentials will be validated when the first API call is made
}

module.exports = validateInput;
