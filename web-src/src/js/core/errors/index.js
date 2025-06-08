/**
 * Frontend error handling pure functions
 * @module core/errors
 */

import { showNotification } from '../../ui/components/notifications/index.js';

/**
 * Process and display an error response
 * @param {Object} response - Error response from backend
 */
export function handleError(response) {
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
export function handleSpecificError(type, message, context = {}) {
  handleError({
    error: {
      code: type,
      message,
      action: context.action || 'Please try again',
      canRetry: context.canRetry !== false,
      context,
    },
  });
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

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @param {string} [options.code] - Error code
 * @param {string} [options.action] - Suggested action
 * @param {boolean} [options.canRetry=true] - Whether the action can be retried
 * @param {Object} [options.context] - Additional context
 * @returns {Object} Standardized error object
 */
export function createError(message, options = {}) {
  const {
    code = 'GENERIC_ERROR',
    action = 'Please try again',
    canRetry = true,
    context = {},
  } = options;

  return {
    error: {
      code,
      message,
      action,
      canRetry,
      context,
    },
  };
}

/**
 * Handle network errors
 * @param {Error} error - Network error
 * @param {Object} context - Additional context
 */
export function handleNetworkError(error, context = {}) {
  handleSpecificError(
    'NETWORK_ERROR',
    'Network error. Please check your connection and try again.',
    {
      ...context,
      originalError: error.message,
    }
  );
}

/**
 * Handle validation errors
 * @param {Object} validationErrors - Validation error details
 * @param {Object} context - Additional context
 */
export function handleValidationError(validationErrors, context = {}) {
  const message =
    typeof validationErrors === 'string'
      ? validationErrors
      : 'Please check your input and try again.';

  handleSpecificError('VALIDATION_ERROR', message, {
    ...context,
    canRetry: false,
    action: 'Please correct the errors and try again',
  });
}
