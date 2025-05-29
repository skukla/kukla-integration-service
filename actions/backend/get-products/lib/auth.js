const endpoints = require('./api/commerce-endpoints');
const { makeCommerceRequest } = require('../../../../src/commerce/api/integration');
const {
  routing: { buildCommerceUrl },
} = require('../../../../src/core');
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
      body: JSON.stringify({
        username: params.COMMERCE_ADMIN_USERNAME,
        password: params.COMMERCE_ADMIN_PASSWORD,
      }),
    });

    if (response.statusCode !== 200) {
      throw new Error('Failed to authenticate with Commerce API');
    }

    // The response body is the token string
    if (typeof response.body !== 'string') {
      throw new Error('Invalid token response from Commerce API');
    }

    return response.body;
  } catch (error) {
    throw new Error(`Failed to authenticate with Commerce: ${error.message}`);
  }
}
module.exports = {
  getAuthToken,
};
