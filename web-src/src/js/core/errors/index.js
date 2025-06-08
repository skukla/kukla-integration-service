/**
 * Frontend error handling pure functions
 * @module core/errors
 */

/**
 * Error handler class for managing frontend errors
 */
export class ErrorHandler {
  /**
   * Process and display an error
   * @param {Object} response - Error response from backend
   */
  static handleError(response) {
    const error = response.error || {
      message: 'An unknown error occurred',
      action: 'Please try again',
      canRetry: true,
    };

    // Dynamic import to avoid circular dependency when we reorganize
    import('../../ui/components/notifications/index.js').then(({ showNotification }) => {
      showNotification(error.message, {
        type: 'error',
        action: error.action,
        canRetry: error.canRetry,
        onRetry: () => {
          if (error.canRetry) {
            // Trigger HTMX retry if available
            const trigger = document.querySelector('[hx-trigger="load"]');
            if (trigger) {
              trigger.setAttribute('hx-trigger', 'revealed');
              trigger.removeAttribute('aria-busy');
            }
          }
        },
      });
    });
  }

  /**
   * Handle a specific error type
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   */
  static handleSpecificError(type, message, context = {}) {
    ErrorHandler.handleError({
      error: {
        code: type,
        message,
        action: context.action || 'Please try again',
        canRetry: context.canRetry !== false,
        context,
      },
    });
  }
}

/**
 * Handle error responses
 * @param {Object} response - Error response
 */
export function handleError(response) {
  ErrorHandler.handleError(response);
}

/**
 * Handle specific error types
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Object} context - Additional context
 */
export function handleSpecificError(type, message, context = {}) {
  ErrorHandler.handleSpecificError(type, message, context);
}

/**
 * Format error message for display
 * @param {Error|Object} error - Error object
 * @returns {string} Formatted error message
 */
export function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    return error.message || error.error || 'Unknown error';
  }

  return String(error) || 'Unknown error';
}
