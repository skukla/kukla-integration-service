/**
 * Adobe Commerce API integration
 * @module commerce/api/integration
 */

const { createClient } = require('./client');
const {
  http: { buildHeaders },
  routing: { buildCommerceUrl },
} = require('../../core');

/**
 * Makes a Commerce API request with commerce-specific handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeCommerceRequest(url, options = {}) {
  const client = createClient();
  return client.request(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });
}

/**
 * Gets an authentication token from Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken(params) {
  const url = buildCommerceUrl(params.COMMERCE_URL, '/rest/V1/integration/admin/token');
  const response = await makeCommerceRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      username: params.COMMERCE_ADMIN_USERNAME,
      password: params.COMMERCE_ADMIN_PASSWORD,
    }),
  });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to get auth token: ${response.body}`);
  }

  return response.body;
}

/**
 * Batches multiple Commerce API requests with commerce-specific handling
 * @param {Array<Object>} requests - Array of request objects
 * @returns {Promise<Array>} Array of responses
 */
async function batchCommerceRequests(requests) {
  const client = createClient();
  return client.processBatch(requests, async (batch) => {
    return Promise.all(
      batch.map((req) =>
        makeCommerceRequest(req.url, {
          ...req.options,
          headers: {
            ...buildHeaders(),
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
