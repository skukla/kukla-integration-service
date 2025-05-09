const { checkMissingRequestInputs } = require('../../utils');

module.exports = async function validateInput(params) {
  const errorMessage = checkMissingRequestInputs(params, []);
  if (errorMessage) throw new Error(`Input validation failed: ${errorMessage}`);
  return 'Input validation passed.';
}; 