/**
 * Adobe Commerce API integration
 * @module commerce/api/integration
 */

const { createClient } = require('./client');
const { loadConfig } = require('../../../config');
const {
  http: { buildHeaders },
} = require('../../core');

/**
 * Gets an authentication token from Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.COMMERCE_BASE_URL - Commerce instance URL
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken(params) {
  const config = loadConfig(params);
  const client = createClient({}, params);
  const response = await client.request(config.commerce.paths.adminToken, {
    method: 'POST',
    body: JSON.stringify({
      username: params.COMMERCE_ADMIN_USERNAME,
      password: params.COMMERCE_ADMIN_PASSWORD,
    }),
  });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to get auth token: ${JSON.stringify(response.body)}`);
  }

  // Remove quotes if present in the token
  return response.body.replace(/^"|"$/g, '');
}

/**
 * Makes a Commerce API request with proper authentication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} params - Request parameters including auth credentials
 * @returns {Promise<Object>} Response data
 */
async function makeCommerceRequest(url, options = {}, params = {}) {
  // Get auth token if not provided
  let token = options.headers?.Authorization?.replace('Bearer ', '');
  if (!token && params.COMMERCE_ADMIN_USERNAME && params.COMMERCE_ADMIN_PASSWORD) {
    token = await getAuthToken(params);
  }

  if (!token) {
    throw new Error('No authentication token available');
  }

  const client = createClient({}, params);
  return client.request(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

/**
 * Batches multiple Commerce API requests
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} params - Request parameters including auth credentials
 * @returns {Promise<Array>} Array of responses
 */
async function batchCommerceRequests(requests, params = {}) {
  // Get auth token once for all requests
  const token = await getAuthToken(params);

  const client = createClient({}, params);
  return client.processBatch(requests, async (batch) => {
    return Promise.all(
      batch.map((req) =>
        makeCommerceRequest(req.url, {
          ...req.options,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(req.options?.headers || {}),
          },
        })
      )
    );
  });
}

module.exports = {
  makeCommerceRequest,
  getAuthToken,
  batchCommerceRequests,
};
