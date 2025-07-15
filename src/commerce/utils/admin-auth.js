/**
 * Commerce Admin Authentication Utilities
 *
 * Low-level pure functions for admin token authentication with Adobe Commerce.
 * Contains admin credential validation and token generation utilities.
 */

const { buildCommerceUrl } = require('../../core/routing/operations/commerce');

/**
 * Generate admin token using username/password authentication
 * @param {Object} params - Parameters containing admin credentials
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<string>} Admin bearer token
 * @throws {Error} When admin credentials are missing or authentication fails
 */
async function getAuthToken(params, config, trace = null) {
  const username = params.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  const tokenUrl = buildCommerceUrl(config.commerce.baseUrl, '/integration/admin/token');

  // Track API call if trace context is provided
  if (trace && trace.incrementApiCalls) {
    trace.incrementApiCalls();
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.status} ${response.statusText}`);
  }

  const token = await response.json();
  return token; // Returns the bearer token string
}

/**
 * Validates admin credentials are present in parameters
 * @param {Object} params - Parameters to validate
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @returns {boolean} True if admin credentials are present
 */
function validateAdminCredentials(params) {
  return !!(params.COMMERCE_ADMIN_USERNAME && params.COMMERCE_ADMIN_PASSWORD);
}

/**
 * Extracts admin credentials from parameters into a clean object
 * @param {Object} params - Parameters containing admin credentials
 * @returns {Object} Admin credentials object
 */
function extractAdminCredentials(params) {
  return {
    username: params.COMMERCE_ADMIN_USERNAME,
    password: params.COMMERCE_ADMIN_PASSWORD,
  };
}

module.exports = {
  getAuthToken,
  validateAdminCredentials,
  extractAdminCredentials,
};
