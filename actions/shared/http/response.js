/**
 * Shared HTTP response utilities for actions
 * @module actions/shared/http/response
 */

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} [additionalInfo={}] - Additional error information
 * @returns {Object} Error response object
 */
function errorResponse(statusCode, message, additionalInfo = {}) {
    return {
        error: {
            statusCode,
            body: {
                error: message,
                ...additionalInfo
            }
        }
    };
}

/**
 * Creates a standardized success response
 * @param {Object} body - Response body
 * @param {Object} [headers={}] - Optional response headers
 * @returns {Object} Success response object
 */
function successResponse(body, headers = {}) {
    return {
        statusCode: 200,
        body,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
}

module.exports = {
    errorResponse,
    successResponse
}; 