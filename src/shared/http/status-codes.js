/**
 * HTTP Status Code Utilities
 * Centralized HTTP status code constants and utilities
 */

// HTTP Status Code Constants
const HTTP_STATUS = {
  // Success 2xx
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Error 4xx
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server Error 5xx
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// HTTP Status Text Mapping - Used by getStatusText
const HTTP_STATUS_TEXT = {
  [HTTP_STATUS.OK]: 'OK',
  [HTTP_STATUS.CREATED]: 'Created',
  [HTTP_STATUS.ACCEPTED]: 'Accepted',
  [HTTP_STATUS.NO_CONTENT]: 'No Content',

  [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Not Found',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HTTP_STATUS.CONFLICT]: 'Conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',

  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HTTP_STATUS.NOT_IMPLEMENTED]: 'Not Implemented',
  [HTTP_STATUS.BAD_GATEWAY]: 'Bad Gateway',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};

/**
 * Get human-readable text for HTTP status code
 * @purpose Convert HTTP status codes to readable text for error messages and debugging
 * @param {number} statusCode - HTTP status code
 * @returns {string} Human-readable status text
 * @usedBy Testing utilities for error message formatting
 */
function getStatusText(statusCode) {
  return HTTP_STATUS_TEXT[statusCode] || 'Unknown Status';
}

/**
 * Check if status code indicates success (2xx range)
 * @purpose Determine if HTTP response was successful
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} True if status indicates success
 * @usedBy Action testing for response validation
 */
function isSuccessStatus(statusCode) {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Get common authentication error status codes
 * @purpose Provide list of status codes that indicate authentication issues
 * @returns {Array<number>} Array of auth-related status codes
 * @usedBy Commerce authentication module for error detection
 */
function getAuthErrorCodes() {
  return [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN];
}

module.exports = {
  HTTP_STATUS,
  getStatusText,
  isSuccessStatus,
  getAuthErrorCodes,
};
