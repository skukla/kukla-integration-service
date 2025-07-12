/**
 * Scripts Core HTTP Utilities
 * Pure HTTP request utilities with no business logic
 */

const fetch = require('node-fetch');

/**
 * Make HTTP POST request with JSON payload
 * @param {string} url - Request URL
 * @param {Object} payload - JSON payload
 * @param {Object} options - Additional request options
 * @returns {Promise<Object>} Response object with status, headers, and body
 */
async function makeJsonPostRequest(url, payload, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(payload),
    ...options,
  });

  const responseBody = await response.json();

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
  };
}

/**
 * Check if HTTP status code indicates success
 * @param {number} status - HTTP status code
 * @returns {boolean} True if successful status
 */
function isSuccessfulStatus(status) {
  return status >= 200 && status < 300;
}

module.exports = {
  makeJsonPostRequest,
  isSuccessfulStatus,
};
