/**
 * HTMX response utilities
 * @module actions/htmx/responses
 */

const { addCacheHeaders } = require('../core/cache');
const { addCompression } = require('../core/compression');
const { ErrorTypes } = require('../core/errors');

// Response configuration
const RESPONSE_CONFIG = {
    DEFAULT_STATUS: 200,
    ERROR_STATUS: 500,
    VALIDATION_STATUS: 400,
    CONTENT_TYPE: 'text/html',
    ERROR_TARGET: '#error-container',
    NOTIFICATION_TARGET: '#notification-container',
    TABLE_TARGET: '.table-content',
    LOADING_CLASS: 'is-loading',
    PROGRESSIVE_LOAD_SIZE: 50 // Number of items per progressive load
};

/**
 * HTMX-specific headers for responses
 * @param {Object} options - Response options
 * @returns {Object} HTMX headers
 */
function getHtmxHeaders(options = {}) {
  const headers = {};

  if (options.target) {
    headers['HX-Retarget'] = options.target;
  }

  if (options.swap) {
    headers['HX-Reswap'] = options.swap;
  }

  if (options.trigger) {
    headers['HX-Trigger'] = options.trigger;
    if (options.triggerData) {
      headers['HX-Trigger-After-Swap'] = JSON.stringify({
        [options.trigger]: options.triggerData
      });
    }
  }

  // Add loading indicator control
  if (options.showLoader !== false) {
    headers['HX-Indicator'] = `.${RESPONSE_CONFIG.LOADING_CLASS}`;
  }

  // Add progressive loading headers if needed
  if (options.progressiveLoad) {
    headers['HX-Push-Url'] = 'false'; // Don't update URL for progressive loads
    headers['HX-Trigger-After-Settle'] = 'checkProgressiveLoad';
  }

  return headers;
}

/**
 * Creates a standard HTMX response with caching and compression
 * @param {Object} options - Response options
 * @param {string} options.html - HTML content
 * @param {number} [options.status=200] - HTTP status code
 * @param {Object} [options.headers={}] - Additional headers
 * @param {string} [options.target] - Target element selector
 * @param {string} [options.swap='innerHTML'] - Swap method
 * @param {string} [options.trigger] - Event to trigger
 * @param {Object} [options.triggerData] - Data to pass with trigger
 * @param {boolean} [options.progressiveLoad] - Whether this is a progressive load
 * @param {Object} [options.cache] - Cache options
 * @param {Object} [options.compression] - Compression options
 * @returns {Promise<Object>} Response object
 */
async function createResponse({
    html,
    status = RESPONSE_CONFIG.DEFAULT_STATUS,
    headers = {},
    target,
    swap = 'innerHTML',
    trigger,
    triggerData,
    progressiveLoad = false,
    cache = {},
    compression = {}
}) {
    // Build base response
    const response = {
        statusCode: status,
        headers: {
            'Content-Type': RESPONSE_CONFIG.CONTENT_TYPE,
            ...getHtmxHeaders({ target, swap, trigger, triggerData, progressiveLoad }),
            ...headers
        },
        body: html
    };

    // Add cache headers
    const cachedResponse = addCacheHeaders(response, {
        maxAge: cache.maxAge,
        public: cache.public,
        noCache: cache.noCache
    });

    // Add compression if needed
    return addCompression(cachedResponse, {
        acceptEncoding: compression.acceptEncoding
    });
}

/**
 * Creates a progressive loading response
 * @param {Object} options - Response options
 * @param {Array} options.items - Items to load
 * @param {number} options.page - Current page number
 * @param {Function} options.renderItem - Function to render single item
 * @param {Object} [options.cache] - Cache options
 * @param {Object} [options.compression] - Compression options
 * @returns {Promise<Object>} Response object
 */
async function createProgressiveResponse({
    items,
    page,
    renderItem,
    cache = {},
    compression = {}
}) {
    const startIndex = (page - 1) * RESPONSE_CONFIG.PROGRESSIVE_LOAD_SIZE;
    const endIndex = startIndex + RESPONSE_CONFIG.PROGRESSIVE_LOAD_SIZE;
    const pageItems = items.slice(startIndex, endIndex);
    const hasMore = endIndex < items.length;

    // Render items for this page
    const html = pageItems.map(renderItem).join('');

    // Create response with appropriate triggers
    return createResponse({
        html,
        target: RESPONSE_CONFIG.TABLE_TARGET,
        swap: 'beforeend',
        trigger: hasMore ? 'loadMore' : 'loadComplete',
        triggerData: { page: page + 1 },
        progressiveLoad: hasMore,
        cache,
        compression
    });
}

/**
 * Creates an error response for HTMX
 * @param {string} type - Error type from ErrorTypes
 * @param {string} message - Error message
 * @param {Object} [context] - Additional context
 * @returns {Promise<Object>} Error response
 */
async function createHtmxError(type, message, context = {}) {
    const errorType = ErrorTypes[type] || ErrorTypes.SYSTEM;
    
    const html = `
        <div class="error-message" role="alert">
            <p>${message || errorType.defaultMessage}</p>
            ${errorType.action ? `<p class="error-action">${errorType.action}</p>` : ''}
        </div>
    `;

    return createResponse({
        html,
        status: errorType.status,
        target: RESPONSE_CONFIG.ERROR_TARGET,
        trigger: 'showError',
        triggerData: { type, message },
        cache: { noCache: true },
        compression: context.compression || {}
    });
}

/**
 * Creates a success response with HTMX headers
 * @param {string} content - HTML content to return
 * @param {Object} options - Additional options
 * @returns {Object} HTMX response
 */
function createHtmxSuccess(content, options = {}) {
  const headers = {
    'Content-Type': 'text/html',
    ...options.headers
  };

  return {
    statusCode: 200,
    headers,
    body: content
  };
}

/**
 * Creates a validation error response
 * @param {Object} errors - Validation errors
 * @param {Object} [options] - Additional options
 * @returns {Object} Validation error response
 */
function validationResponse(errors, options = {}) {
    const errorList = Object.entries(errors)
        .map(([field, message]) => `<li>${field}: ${message}</li>`)
        .join('');

    const errorHtml = `
        <div class="validation-errors" role="alert">
            <h3>Please correct the following errors:</h3>
            <ul>${errorList}</ul>
        </div>
    `;

    return createResponse({
        html: errorHtml,
        status: RESPONSE_CONFIG.VALIDATION_STATUS,
        target: RESPONSE_CONFIG.ERROR_TARGET,
        trigger: 'validationFailed',
        triggerData: { errors },
        ...options
    });
}

module.exports = {
    RESPONSE_CONFIG,
    createResponse,
    createProgressiveResponse,
    createHtmxError,
    createHtmxSuccess,
    validationResponse
}; 