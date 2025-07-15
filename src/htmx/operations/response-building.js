/**
 * HTMX Response Building Operations
 *
 * Mid-level business logic for building standardized HTMX responses.
 * Contains operations that construct consistent response formats for HTMX interactions.
 */

/**
 * Build successful HTMX HTML response
 * Business operation that constructs standardized HTML response for HTMX.
 *
 * @param {string} htmlContent - HTML content to return
 * @param {Object} [options] - Response options
 * @param {Object} [options.headers] - Additional headers
 * @param {string} [options.cacheControl] - Cache control setting
 * @returns {Object} Standardized HTMX HTML response
 */
function buildHtmlResponse(htmlContent, options = {}) {
  const { headers = {}, cacheControl = 'no-cache' } = options;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': cacheControl,
      ...headers,
    },
    body: htmlContent,
  };
}

/**
 * Build HTMX error response
 * Business operation that constructs standardized error response for HTMX.
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

  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: errorHtml,
  };
}

/**
 * Build file browser response
 * Business operation that constructs response for file browser UI.
 *
 * @param {string} fileBrowserHTML - Complete file browser HTML
 * @returns {Object} File browser response
 */
function buildFileBrowserResponse(fileBrowserHTML) {
  return buildHtmlResponse(fileBrowserHTML, {
    headers: {
      'HX-Trigger': 'file-browser-updated',
    },
  });
}

/**
 * Build file operation success response
 * Business operation that constructs response for successful file operations.
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
 *
 * @param {string} modalHTML - Modal HTML content
 * @param {Object} [options] - Modal options
 * @param {boolean} [options.show] - Whether to show the modal
 * @returns {Object} Modal response
 */
function buildModalResponse(modalHTML, options = {}) {
  const { show = true } = options;

  const headers = {
    'HX-Trigger': show ? 'show-modal' : 'hide-modal',
  };

  return buildHtmlResponse(modalHTML, { headers });
}

/**
 * Build notification response
 * Business operation that constructs response for notifications.
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

  const headers = {
    'HX-Trigger': JSON.stringify({
      'show-notification': notificationData,
    }),
  };

  return buildHtmlResponse('', { headers });
}

/**
 * Build redirect response
 * Business operation that constructs response for client-side redirects.
 *
 * @param {string} url - URL to redirect to
 * @param {Object} [options] - Redirect options
 * @param {boolean} [options.replace] - Whether to replace current history entry
 * @returns {Object} Redirect response
 */
function buildRedirectResponse(url, options = {}) {
  const { replace = false } = options;

  const headers = {
    'HX-Redirect': url,
    ...(replace && { 'HX-Replace-Url': 'true' }),
  };

  return {
    statusCode: 302,
    headers,
    body: '',
  };
}

/**
 * Build refresh response
 * Business operation that constructs response to trigger page refresh.
 *
 * @param {string} [target] - Specific target to refresh
 * @returns {Object} Refresh response
 */
function buildRefreshResponse(target = '') {
  const headers = target ? { 'HX-Trigger': `refresh-${target}` } : { 'HX-Refresh': 'true' };

  return {
    statusCode: 200,
    headers,
    body: '',
  };
}

/**
 * Build loading response
 * Business operation that constructs response to show loading state.
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
