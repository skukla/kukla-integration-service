/**
 * Frontend error handling pure functions
 * @module web-src/src/js/core/error-handler
 */

import { showNotification } from './notifications.js';

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
