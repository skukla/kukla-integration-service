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
const { checkMissingRequestInputs } = require('../../../utils/shared/validation/input');

module.exports = async function validateInput(params) {
  const requiredParams = [
    'COMMERCE_URL',
    'COMMERCE_ADMIN_USERNAME',
    'COMMERCE_ADMIN_PASSWORD'
  ];
  
  const errorMessage = checkMissingRequestInputs(params, requiredParams);
  if (errorMessage) {
    throw new Error(`Input validation failed: ${errorMessage}`);
  }
  
  return 'Input validation passed.';
}; 