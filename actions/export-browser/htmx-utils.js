/**
 * HTMX response utilities for the export browser
 * @module htmx-utils
 */

/**
 * Returns an HTML response formatted for HTMX
 * @param {string} html - The HTML content to return
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Response object formatted for HTMX
 */
function htmlResponse(html, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'text/html'
        },
        body: html
    };
}

/**
 * Returns an error response formatted for HTMX
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {object} Error response object
 */
function errorResponse(error, statusCode = 500) {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
        statusCode,
        headers: {
            'Content-Type': 'text/html'
        },
        body: `
            <div class="spectrum-Well spectrum-Well--error">
                ${errorMessage}
            </div>
        `
    };
}

module.exports = {
    htmlResponse,
    errorResponse
}; 