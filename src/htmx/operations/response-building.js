/**
 * HTMX Response Building Operations
 *
 * Mid-level business logic for building standardized HTMX responses.
 * Contains operations that construct consistent response formats for HTMX interactions.
 *
 * HTMX responses are HTML-based but follow the same architectural patterns as other domains:
 * - Thin wrappers around core HTMX response utilities
 * - Consistent response structure across all HTMX operations
 * - Single source of truth for HTMX response formatting
 */

// HTMX-specific core response utilities (specialized for HTML content)
const htmxCore = {
  /**
   * Core HTMX HTML response builder
   * Foundation for all HTMX responses that return HTML content.
   *
   * @param {string} htmlContent - HTML content to return
   * @param {Object} [options] - Response options
   * @param {number} [options.statusCode] - HTTP status code
   * @param {Object} [options.headers] - Additional headers
   * @param {string} [options.cacheControl] - Cache control setting
   * @returns {Object} Core HTMX HTML response
   */
  htmlResponse: (htmlContent, options = {}) => {
    const { statusCode = 200, headers = {}, cacheControl = 'no-cache' } = options;

    return {
      statusCode,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': cacheControl,
        ...headers,
      },
      body: htmlContent,
    };
  },

  /**
   * Core HTMX redirect response builder
   * Foundation for all HTMX responses that trigger redirects.
   *
   * @param {string} url - URL to redirect to
   * @param {Object} [options] - Response options
   * @param {number} [options.statusCode] - HTTP status code
   * @param {boolean} [options.replace] - Whether to replace current history entry
   * @returns {Object} Core HTMX redirect response
   */
  redirectResponse: (url, options = {}) => {
    const { statusCode = 302, replace = false } = options;

    return {
      statusCode,
      headers: {
        'HX-Redirect': url,
        ...(replace && { 'HX-Replace-Url': 'true' }),
      },
      body: '',
    };
  },

  /**
   * Core HTMX trigger response builder
   * Foundation for all HTMX responses that trigger client-side events.
   *
   * @param {string|Object} trigger - Trigger event(s) to send
   * @param {Object} [options] - Response options
   * @param {number} [options.statusCode] - HTTP status code
   * @param {string} [options.body] - Response body content
   * @returns {Object} Core HTMX trigger response
   */
  triggerResponse: (trigger, options = {}) => {
    const { statusCode = 200, body = '' } = options;

    const triggerHeader = typeof trigger === 'string' ? trigger : JSON.stringify(trigger);

    return {
      statusCode,
      headers: {
        'HX-Trigger': triggerHeader,
      },
      body,
    };
  },
};

/**
 * Build successful HTMX HTML response
 * Business operation that constructs standardized HTML response for HTMX.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} htmlContent - HTML content to return
 * @param {Object} [options] - Response options
 * @param {Object} [options.headers] - Additional headers
 * @param {string} [options.cacheControl] - Cache control setting
 * @returns {Object} Standardized HTMX HTML response
 */
function buildHtmlResponse(htmlContent, options = {}) {
  return htmxCore.htmlResponse(htmlContent, options);
}

/**
 * Build HTMX error response
 * Business operation that constructs standardized error response for HTMX.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} errorMessage - Error message to display
 * @param {Object} [options] - Error response options
 * @param {number} [options.statusCode] - HTTP status code
 * @param {string} [options.context] - Additional context information
 * @returns {Object} Standardized HTMX error response
 */
function buildHtmlErrorResponse(errorMessage, options = {}) {
  const { statusCode = 500, context = '' } = options;

  const errorHtml = `
    <div class="error-message htmx-error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>Error</h4>
        <p>${errorMessage}</p>
        ${context ? `<p class="error-context">${context}</p>` : ''}
      </div>
    </div>
  `;

  return htmxCore.htmlResponse(errorHtml, { statusCode });
}

/**
 * Build file browser response
 * Business operation that constructs response for file browser UI.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} fileBrowserHTML - Complete file browser HTML
 * @returns {Object} File browser response
 */
function buildFileBrowserResponse(fileBrowserHTML) {
  return htmxCore.htmlResponse(fileBrowserHTML, {
    headers: {
      'HX-Trigger': 'file-browser-updated',
    },
  });
}

/**
 * Build file operation success response
 * Business operation that constructs response for successful file operations.
 * Uses unified HTMX response pattern through buildHtmlResponse.
 *
 * @param {string} successMessage - Success message
 * @param {string} updatedBrowserHTML - Updated file browser HTML
 * @returns {Object} File operation success response
 */
function buildFileOperationSuccessResponse(successMessage, updatedBrowserHTML) {
  return buildHtmlResponse(updatedBrowserHTML, {
    headers: {
      'HX-Trigger': JSON.stringify({
        'file-operation-success': { message: successMessage },
        'file-browser-updated': true,
      }),
    },
  });
}

/**
 * Build file operation error response
 * Business operation that constructs response for failed file operations.
 * Uses unified HTMX response pattern through buildHtmlErrorResponse.
 *
 * @param {string} errorMessage - Error message
 * @param {string} operation - Operation that failed (e.g., 'delete', 'upload')
 * @param {string} [fileName] - Name of file involved in operation
 * @returns {Object} File operation error response
 */
function buildFileOperationErrorResponse(errorMessage, operation, fileName = '') {
  const context = fileName
    ? `Operation: ${operation}, File: ${fileName}`
    : `Operation: ${operation}`;

  return buildHtmlErrorResponse(errorMessage, {
    statusCode: 400,
    context,
  });
}

/**
 * Build modal response
 * Business operation that constructs response for modal dialogs.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} modalHTML - Modal HTML content
 * @param {Object} [options] - Modal options
 * @param {boolean} [options.show] - Whether to show the modal
 * @returns {Object} Modal response
 */
function buildModalResponse(modalHTML, options = {}) {
  const { show = true } = options;

  return htmxCore.htmlResponse(modalHTML, {
    headers: {
      'HX-Trigger': show ? 'show-modal' : 'hide-modal',
    },
  });
}

/**
 * Build notification response
 * Business operation that constructs response for notifications.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {Object} [options] - Notification options
 * @param {number} [options.duration] - Auto-hide duration in milliseconds
 * @returns {Object} Notification response
 */
function buildNotificationResponse(message, type, options = {}) {
  const { duration = 5000 } = options;

  const notificationData = {
    message,
    type,
    duration,
    timestamp: new Date().toISOString(),
  };

  return htmxCore.triggerResponse({
    'show-notification': notificationData,
  });
}

/**
 * Build redirect response
 * Business operation that constructs response for client-side redirects.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} url - URL to redirect to
 * @param {Object} [options] - Redirect options
 * @param {boolean} [options.replace] - Whether to replace current history entry
 * @returns {Object} Redirect response
 */
function buildRedirectResponse(url, options = {}) {
  return htmxCore.redirectResponse(url, options);
}

/**
 * Build refresh response
 * Business operation that constructs response to trigger page refresh.
 * Thin wrapper around core HTMX response utilities.
 *
 * @param {string} [target] - Specific target to refresh
 * @returns {Object} Refresh response
 */
function buildRefreshResponse(target = '') {
  if (target) {
    return htmxCore.triggerResponse(`refresh-${target}`);
  } else {
    return htmxCore.htmlResponse('', {
      headers: {
        'HX-Refresh': 'true',
      },
    });
  }
}

/**
 * Build loading response
 * Business operation that constructs response to show loading state.
 * Uses unified HTMX response pattern through buildHtmlResponse.
 *
 * @param {string} loadingMessage - Loading message to display
 * @returns {Object} Loading response
 */
function buildLoadingResponse(loadingMessage) {
  const loadingHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>${loadingMessage}</p>
    </div>
  `;

  return buildHtmlResponse(loadingHTML);
}

module.exports = {
  buildHtmlResponse,
  buildHtmlErrorResponse,
  buildFileBrowserResponse,
  buildFileOperationSuccessResponse,
  buildFileOperationErrorResponse,
  buildModalResponse,
  buildNotificationResponse,
  buildRedirectResponse,
  buildRefreshResponse,
  buildLoadingResponse,
};
