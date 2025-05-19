/**
 * Validates the required input parameters for the Adobe Commerce integration.
 * 
 * @param {Object} params - The parameters object containing configuration values
 * @param {string} params.COMMERCE_URL - The base URL of the Adobe Commerce instance
 * @param {string} params.token - Authentication token for Commerce API
 * @returns {Promise<string>} A success message if validation passes
 * @throws {Error} If any required parameter is missing or invalid
 */
const { validateRequired, validateString, validateUrl } = require('../../../core/validation');

/**
 * Validate input parameters
 * @param {Object} params - Input parameters
 * @returns {Promise<string>} Success message
 * @throws {Error} If any required parameter is missing or invalid
 */
async function validateInput(params) {
  const requiredParams = [
    'COMMERCE_URL',
    'token'
  ];

  // Check required fields
  validateRequired(params, requiredParams);

  // Validate string fields
  validateString(params.token, 'token');

  // Validate URL fields
  validateUrl(params.COMMERCE_URL, 'COMMERCE_URL');

  return 'Input validation successful';
}

module.exports = validateInput; 