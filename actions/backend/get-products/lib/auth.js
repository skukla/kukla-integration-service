/**
 * Authentication-related functions for Adobe Commerce API
 * @module auth
 */

const fetch = require('node-fetch');
const { buildHeaders } = require('../../../utils/shared/http/headers');
const { errorResponse } = require('../../../utils/shared/http/response');
const { getBearerToken, fetchAdminToken } = require('../../../utils/backend/auth/commerce');

/**
 * Resolves the Bearer token to use for API calls.
 * @async
 * @param {Object} params - Action input parameters
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