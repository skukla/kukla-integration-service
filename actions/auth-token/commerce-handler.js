/**
 * Commerce Token Handler
 * Handles Adobe Commerce admin token generation
 * This will remain when app is integrated with Commerce Admin SDK
 */

const { Core } = require('@adobe/aio-sdk');
const createConfig = require('../../config');
const { getCommerceToken } = require('../../lib/commerce');
const { errorResponse, successResponse, checkMissingRequestInputs } = require('../../lib/utils');

/**
 * Handle Commerce admin token generation
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Response object
 */
async function handleCommerceToken(params) {
  const logger = Core.Logger('auth-token-commerce', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters for Commerce token generation
    const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Generating Commerce admin token');

    // Generate Commerce admin token
    const config = createConfig(params);
    const token = await getCommerceToken(params, config);

    logger.info('Commerce admin token generated successfully');

    // Return token in Adobe standard format
    return successResponse(
      {
        token,
        type: 'Commerce Admin Token',
        expiresIn: '24 hours',
        usage: 'Include as Authorization: Bearer <token> in subsequent API calls',
      },
      'Commerce admin token generated successfully',
      logger
    );
  } catch (error) {
    logger.error('Token generation failed', { error: error.message });
    return errorResponse(500, `Token generation failed: ${error.message}`, logger);
  }
}

module.exports = {
  handleCommerceToken
};