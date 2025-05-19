const { request, headers, buildCommerceUrl } = require('../../../../core/http');
const { validateAdminCredentials } = require('../../../../commerce/integration');

/**
 * Get authentication token from Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.username - Commerce admin username
 * @param {string} params.password - Commerce admin password
 * @param {string} params.baseUrl - Commerce instance base URL
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken({ username, password, baseUrl }) {
  const url = buildCommerceUrl(baseUrl, '/V1/integration/admin/token');
  const response = await request(url, {
    method: 'POST',
    headers: headers.json,
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return response.text();
}

module.exports = {
  getAuthToken,
}; 