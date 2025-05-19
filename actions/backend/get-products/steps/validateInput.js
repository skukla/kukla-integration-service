/**
 * Validates the required input parameters for the Adobe Commerce integration.
 * 
 * @param {Object} params - The parameters object containing configuration values
 * @param {string} params.COMMERCE_URL - The base URL of the Adobe Commerce instance
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username for authentication
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password for authentication
 * @returns {Promise<string>} A success message if validation passes
 * @throws {Error} If any required parameter is missing
 */
const { validateRequired, validateString } = require('../../../core/validation');

/**
 * Validate input parameters
 * @param {Object} params - Input parameters
 * @throws {Error} If any required parameter is missing
 */
async function validateInput(params) {
  const requiredParams = [
    'baseUrl',
    'token'
  ];

  validateRequired(params, requiredParams);
  validateString(params.baseUrl, 'baseUrl');
  validateString(params.token, 'token');
}

module.exports = validateInput; 