const { checkMissingRequestInputs } = require('../../utils');

module.exports = async function validateInput(params) {
  const requiredParams = ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
  const errorMessage = checkMissingRequestInputs(params, requiredParams);
  if (errorMessage) throw new Error(`Input validation failed: ${errorMessage}`);
  return 'Input validation passed.';
}; 