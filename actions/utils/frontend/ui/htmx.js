/**
 * HTMX-specific response utilities
 * @module utils/frontend/ui/htmx
 */

/**
 * Creates an HTML response object suitable for HTMX
 * @param {string} html - HTML content
 * @param {Object} [options] - Response options
 * @param {number} [options.status=200] - HTTP status code
 * @param {Object} [options.headers={}] - Additional headers
 * @param {string} [options.trigger] - HTMX trigger event
 * @returns {Object} Response object formatted for HTMX
 */
function htmlResponse(html, options = {}) {
    const { status = 200, headers = {}, trigger } = options;
    
    const responseHeaders = {
        'Content-Type': 'text/html',
        ...headers
    };
    
    if (trigger) {
        responseHeaders['HX-Trigger'] = trigger;
    }
    
    return {
        statusCode: status,
        headers: responseHeaders,
        body: html
    };
}

/**
 * Creates a redirect response for HTMX
 * @param {string} url - URL to redirect to
 * @param {Object} [options] - Redirect options
 * @param {boolean} [options.pushUrl=false] - Whether to push the URL to browser history
 * @returns {Object} Redirect response object
 */
function redirectResponse(url, options = {}) {
    const { pushUrl = false } = options;
    
    return {
        statusCode: 200,
        headers: {
            'HX-Redirect': url,
            ...(pushUrl ? { 'HX-Push-Url': url } : {})
        }
    };
}

module.exports = {
    htmlResponse,
    redirectResponse
}; 