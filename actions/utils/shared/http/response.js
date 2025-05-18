/**
 * Shared HTTP response utilities
 * @module utils/shared/http/response
 */

/**
 * Creates an error response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} [logger] - Optional logger instance
 * @returns {Object} Error response object
 */
function errorResponse(statusCode, message, logger) {
    if (logger) {
        const logMethod = statusCode >= 500 ? 'error' : 'warn';
        if (typeof logger[logMethod] === 'function') {
            logger[logMethod](`${statusCode}: ${message}`);
        }
    }
    return {
        error: {
            statusCode,
            body: { error: message }
        }
    };
}

/**
 * Creates a success response object
 * @param {*} body - Response body
 * @param {number} [status=200] - HTTP status code
 * @param {Object} [headers={}] - Additional headers
 * @returns {Object} Success response object
 */
function successResponse(body, status = 200, headers = {}) {
    return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json', ...headers },
        body
    };
}

module.exports = {
    errorResponse,
    successResponse
}; 