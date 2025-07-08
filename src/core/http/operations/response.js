/**
 * HTTP Response Processing Operations
 * @module core/http/operations/response
 */

/**
 * Processes HTTP response and extracts body
 * @param {Response} response - Fetch response object
 * @returns {Promise<*>} Parsed response body
 */
async function processResponseBody(response) {
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

/**
 * Creates HTTP error from response
 * @param {Response} response - Fetch response object
 * @param {*} body - Response body
 * @returns {Error} HTTP error with status information
 */
function createHttpError(response, body) {
  const error = new Error(`HTTP error! status: ${response.status}`);
  error.status = response.status;
  error.statusText = response.statusText;
  error.body = body;
  return error;
}

module.exports = {
  processResponseBody,
  createHttpError,
};
