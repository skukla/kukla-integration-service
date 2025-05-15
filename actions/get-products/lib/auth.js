/**
 * Authentication-related functions for Adobe Commerce API
 * @module auth
 */

const { getBearerToken, fetchAdminToken } = require('../../utils');

/**
 * Resolves the Bearer token to use for API calls.
 * @async
 * @param {Object} params - Action input parameters
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username (if token not provided)
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password (if token not provided)
 * @returns {Promise<string>} The Bearer token for API authentication
 */
async function resolveToken(params) {
  const incomingToken = getBearerToken(params);
  if (incomingToken) {
    return incomingToken;
  } else {
    return await fetchAdminToken(params);
  }
}

module.exports = {
  resolveToken
}; 