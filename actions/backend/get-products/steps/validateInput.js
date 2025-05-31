/**
 * Step to validate input parameters
 * @module steps/validateInput
 */
const {
  data: {
    product: { PRODUCT_FIELDS },
  },
} = require('../../../../src/commerce');
const { checkMissingParams } = require('../../../../src/core/http/client');

/**
 * Validates the input parameters for the action
 * @param {import('../index.js').ActionParams} params
 * @throws {Error} If required parameters are missing or invalid
 */
async function validateInput(params) {
  console.log('Validating input parameters:', JSON.stringify(params, null, 2));

  const requiredParams = ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];

  // Check for missing required parameters
  const errorMessage = checkMissingParams(params, requiredParams);
  if (errorMessage) {
    console.error('Missing required parameters:', errorMessage);
    throw new Error(errorMessage);
  }
  console.log('Required parameters validation passed');

  // Validate URL format
  try {
    new URL(params.COMMERCE_URL);
    console.log('URL validation passed');
  } catch (error) {
    console.error('Invalid URL format:', params.COMMERCE_URL);
    throw new Error('Invalid COMMERCE_URL format');
  }

  // Validate fields parameter if provided
  if (params.fields !== undefined) {
    console.log('Validating fields:', params.fields);
    if (!Array.isArray(params.fields)) {
      console.error('Invalid fields type:', typeof params.fields);
      throw new Error('fields must be an array');
    }

    const invalidFields = params.fields.filter((field) => !PRODUCT_FIELDS.ALL.includes(field));
    if (invalidFields.length > 0) {
      console.error('Invalid fields requested:', invalidFields);
      throw new Error(
        `Invalid fields requested: ${invalidFields.join(', ')}. Available fields are: ${PRODUCT_FIELDS.ALL.join(', ')}`
      );
    }
    console.log('Fields validation passed');
  }

  console.log('All input validation passed');
}

module.exports = validateInput;
