const fetch = require('node-fetch');
const { headers } = require('../../../../core/http');
const { buildCommerceUrl } = require('../../../../commerce/integration');

/**
 * Get authentication token from Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.username - Commerce admin username
 * @param {string} params.password - Commerce admin password
 * @param {string} params.COMMERCE_URL - Commerce instance base URL
 * @returns {Promise<string>} Authentication token
 * @throws {Error} If authentication fails
 */
async function getAuthToken({ username, password, COMMERCE_URL }) {
  const url = buildCommerceUrl(COMMERCE_URL, '/V1/integration/admin/token');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers.json,
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!res.ok) {
      throw new Error(`Authentication failed: ${res.status} ${await res.text()}`);
    }

    return res.text();
  } catch (error) {
    throw new Error(`Failed to authenticate with Commerce: ${error.message}`);
  }
}

module.exports = {
  getAuthToken,
}; 