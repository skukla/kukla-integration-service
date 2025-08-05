/**
 * Adobe App Builder Action: Generate Adobe Commerce Admin Token
 * Follows Adobe standard patterns with direct exports.main
 *
 * This action provides centralized token generation for Commerce API access.
 * Future migration point for IMS integration.
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { getCommerceToken } = require('../../lib/commerce');
const { errorResponse, successResponse, checkMissingRequestInputs } = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('auth-token', { level: params.LOG_LEVEL || 'info' });

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
        expiresIn: '24 hours', // Commerce tokens typically expire in 24 hours
        usage: 'Include as Authorization: Bearer <token> in subsequent API calls',
      },
      'Commerce admin token generated successfully',
      logger
    );
  } catch (error) {
    logger.error('Token generation failed', { error: error.message, stack: error.stack });
    return errorResponse(500, `Token generation failed: ${error.message}`, logger);
  }
}

exports.main = main;
