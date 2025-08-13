/**
 * Adobe App Builder Action: Authentication Token Management
 * Handles multiple authentication operations in a modular way
 *
 * Operations:
 * - commerce-token: Generate Adobe Commerce admin token (default)
 * - ims-exchange: Exchange IMS OAuth code for token (REMOVE when using Commerce Admin SDK)
 * - validate-password: Validate app password (REMOVE when using Commerce Admin SDK)
 */

const { Core } = require('@adobe/aio-sdk');
const { errorResponse } = require('../../lib/utils');

// Modular handlers - easy to remove when migrating to Commerce Admin SDK
const { handleCommerceToken } = require('./commerce-handler');
const { handleIMSCodeExchange, validateAppPassword } = require('./ims-handler');

async function main(params) {
  const logger = Core.Logger('auth-token', { level: params.LOG_LEVEL || 'info' });
  
  // Determine operation based on parameters
  const operation = params.operation || 'commerce-token';
  
  logger.info('Auth token operation', { operation });

  try {
    switch (operation) {
      case 'commerce-token':
        // This stays when integrated with Commerce Admin SDK
        return await handleCommerceToken(params);
        
      case 'ims-exchange':
        // REMOVE this case when using Commerce Admin SDK
        return await handleIMSCodeExchange(params);
        
      case 'validate-password':
        // REMOVE this case when using Commerce Admin SDK
        return await validateAppPassword(params);
        
      default:
        return errorResponse(400, `Invalid operation: ${operation}`, logger);
    }
  } catch (error) {
    logger.error('Auth token operation failed', { 
      operation, 
      error: error.message, 
      stack: error.stack 
    });
    return errorResponse(500, `Authentication operation failed: ${error.message}`, logger);
  }
}

exports.main = main;
