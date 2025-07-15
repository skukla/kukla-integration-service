/**
 * Products Validation Operations
 *
 * Mid-level business logic for product validation operations.
 * Contains action-level validation that coordinates multiple validation utilities.
 */

const { checkMissingParams } = require('../../core/validation/operations/parameters');

/**
 * Validates the input parameters for product actions
 * Business operation that checks required admin credentials and configuration.
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params, config) {
  // Validate admin credentials as parameters
  const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  // Validate Commerce URL from configuration
  try {
    const commerceUrl = config.commerce.baseUrl;

    if (!commerceUrl) {
      throw new Error('Commerce URL not configured in environment');
    }

    // Validate URL format
    new URL(commerceUrl);
  } catch (error) {
    throw new Error(`Invalid Commerce configuration: ${error.message}`);
  }

  // Admin credentials will be validated when the first API call is made
}

/**
 * Validates the input parameters for mesh product actions
 * Business operation that checks required admin credentials and mesh configuration.
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateMeshInput(params, config) {
  // First validate basic input requirements
  await validateInput(params, config);

  // Validate mesh-specific configuration
  if (!config.mesh) {
    throw new Error('Mesh configuration not found');
  }

  if (!config.mesh.endpoint) {
    throw new Error('Mesh endpoint not configured');
  }

  if (!config.mesh.apiKey) {
    throw new Error('Mesh API key not configured');
  }

  // Admin credentials are already validated by validateInput
}

module.exports = {
  validateInput,
  validateMeshInput,
};
