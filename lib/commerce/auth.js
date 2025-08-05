/**
 * Adobe Commerce Authentication Module
 * Handles admin token generation following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Get Commerce admin token for API authentication
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<string>} Commerce admin bearer token
 */
async function getCommerceToken(params, config, logger = null) {
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

module.exports = {
  getCommerceToken,
};
