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
  const statusText = getReadableStatusText(response.status);
  const error = new Error(`${statusText} (${response.status})`);
  error.status = response.status;
  error.statusText = response.statusText;
  error.body = body;
  return error;
}

/**
 * Get human-readable status text for HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string} Human-readable status text
 */
function getReadableStatusText(status) {
  const statusMap = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  return statusMap[status] || 'Server Error';
}

module.exports = {
  processResponseBody,
  createHttpError,
};
