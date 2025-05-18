/**
 * Adobe Commerce authentication utilities
 * @module utils/backend/auth/commerce
 */

const fetch = require('node-fetch');
const { buildHeaders } = require('../../shared/http/headers');

/**
 * Validates Adobe Commerce admin credentials
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @throws {Error} If credentials are missing
 */
function validateAdminCredentials(username, password) {
    if (!username || !password) {
        throw new Error('Missing required credentials: username and password must be provided');
    }
}

/**
 * Fetches an admin token from Adobe Commerce
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @returns {Promise<string>} Admin Bearer token
 * @throws {Error} If the request fails or credentials are invalid
 */
async function fetchAdminToken(params = {}) {
    const { COMMERCE_ADMIN_USERNAME: username, COMMERCE_ADMIN_PASSWORD: password, COMMERCE_URL: url } = params;
    
    validateAdminCredentials(username, password);

    const response = await fetch(`${url}/rest/V1/integration/admin/token`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ username, password })
    });

    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Failed to fetch admin token: ${response.status} ${text}`);
    }

    return JSON.parse(text);
}

module.exports = {
    validateAdminCredentials,
    fetchAdminToken
}; 