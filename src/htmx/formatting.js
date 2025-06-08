/**
 * HTMX formatting utilities
 * @module htmx/formatting
 */

const HTMX_CONFIG = {
  CONTENT_TYPE: 'text/html',
  DEFAULT_STATUS: 200,
  HEADERS: {
    TARGET: 'HX-Target',
    TRIGGER: 'HX-Trigger',
    SWAP: 'HX-Swap',
    PUSH_URL: 'HX-Push-Url',
    REDIRECT: 'HX-Redirect',
    REFRESH: 'HX-Refresh',
  },
};

/**
 * Gets HTMX-specific headers based on options
 * @private
 * @param {Object} options - HTMX options
 * @returns {Object} HTMX headers
 */
function getHtmxHeaders({ target, swap, trigger, triggerData, progressiveLoad }) {
  const headers = {};

  if (target) {
    headers[HTMX_CONFIG.HEADERS.TARGET] = target;
  }

  if (swap) {
    headers[HTMX_CONFIG.HEADERS.SWAP] = swap;
  }

  if (trigger) {
    if (triggerData) {
      headers[HTMX_CONFIG.HEADERS.TRIGGER] = JSON.stringify({
        [trigger]: triggerData,
      });
    } else {
      headers[HTMX_CONFIG.HEADERS.TRIGGER] = trigger;
    }
  }

  if (progressiveLoad) {
    headers[HTMX_CONFIG.HEADERS.PUSH_URL] = 'false';
  }

  return headers;
}

/**
 * Creates an HTML response with HTMX headers
 * @param {Object} options - Response options
 * @returns {Object} Response object with HTMX headers
 */
function createHtmxResponse({
  html,
  status = HTMX_CONFIG.DEFAULT_STATUS,
  headers = {},
  target,
  swap = 'innerHTML',
  trigger,
  triggerData,
  progressiveLoad = false,
}) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': HTMX_CONFIG.CONTENT_TYPE,
      ...getHtmxHeaders({ target, swap, trigger, triggerData, progressiveLoad }),
      ...headers,
    },
    body: html,
  };
}

module.exports = {
  HTMX_CONFIG,
  createHtmxResponse,
};
