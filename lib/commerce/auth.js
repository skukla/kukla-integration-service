/**
 * Adobe Commerce Authentication Module
 * Handles admin token generation following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Get admin token for Commerce API authentication
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<string>} Bearer token
 */
async function getAdminToken(params, config, logger = null) {
  const log = logger || Core.Logger('commerce-auth');
  const { baseUrl, api } = config.commerce;

  if (!params.COMMERCE_ADMIN_USERNAME || !params.COMMERCE_ADMIN_PASSWORD) {
    const error = 'Commerce admin credentials not provided';
    log.error('Authentication failed', { error });
    throw new Error(error);
  }

  const tokenUrl = `${baseUrl}/rest/${api.version}${api.paths.adminToken}`;

  try {
    log.info('Requesting Commerce admin token');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: params.COMMERCE_ADMIN_USERNAME,
        password: params.COMMERCE_ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // If we can't read the error body, just use status
      }
      log.error('Token request failed', { status: response.status, error: errorDetails });
      throw new Error(`Token request failed: ${errorDetails}`);
    }

    const token = await response.json();
    log.info('Commerce admin token retrieved successfully');
    return token.replace(/"/g, ''); // Remove quotes from token
  } catch (error) {
    log.error('Commerce token generation failed', { error: error.message });
    throw error;
  }
}

/**
 * Get Commerce admin token using the dedicated auth-token action
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<string>} Commerce admin bearer token
 */
async function getCommerceToken(params, config, logger = null) {
  const log = logger || Core.Logger('commerce-auth');
  // Note: config parameter added for consistency with getAdminToken, though not currently used
  // This provides a consistent interface for future enhancements

  try {
    log.info('Requesting Commerce token via auth-token action');
    const authTokenAction = require('../../actions/auth-token/index');
    const result = await authTokenAction.main(params);

    if (result.statusCode !== 200) {
      const error = `Token generation failed: ${result.body?.error}`;
      log.error('Auth token action failed', {
        statusCode: result.statusCode,
        error: result.body?.error,
      });
      throw new Error(error);
    }

    log.info('Commerce token retrieved successfully via auth-token action');
    return result.body.token;
  } catch (error) {
    log.error('Commerce token retrieval failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  getAdminToken,
  getCommerceToken,
};
