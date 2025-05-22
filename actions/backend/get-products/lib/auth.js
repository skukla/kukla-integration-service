const { buildHeaders } = require('../../../core/http');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../commerce/integration');
const endpoints = require('./api/commerce-endpoints');

/**
 * Get authentication token from Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Commerce admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Commerce admin password
 * @param {string} params.COMMERCE_URL - Commerce instance base URL
 * @returns {Promise<string>} Authentication token
 * @throws {Error} If authentication fails
 */
async function getAuthToken(params) {
  try {
    const url = buildCommerceUrl(params.COMMERCE_URL, endpoints.adminToken());
    
    const response = await makeCommerceRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        username: params.COMMERCE_ADMIN_USERNAME,
        password: params.COMMERCE_ADMIN_PASSWORD
      })
    });

    if (response.statusCode !== 200) {
      throw new Error('Failed to authenticate with Commerce API');
    }

    return response.body;
  } catch (error) {
    throw new Error(`Failed to authenticate with Commerce: ${error.message}`);
  }
}

module.exports = {
  getAuthToken
}; 