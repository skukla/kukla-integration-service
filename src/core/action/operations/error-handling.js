/**
 * Core Action - Error Handling Operations
 * Business logic for standardized action error handling
 */

const { response } = require('../../http/responses');

/**
 * Standard action error handler
 * @param {Object} error - Error object
 * @param {Object} context - Action context
 * @returns {Object} Error response
 */
function handleActionError(error, context = {}) {
  const { logger, traceContext } = context;

  if (logger) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
  }

  if (traceContext && !traceContext.disabled) {
    traceContext.errors.push({
      message: error.message,
      timestamp: Date.now(),
    });
  }

  return response.error(error);
}

/**
 * Action success handler with optional tracing
 * @param {*} data - Success data
 * @param {Object} context - Action context
 * @returns {Object} Success response
 */
function handleActionSuccess(data, context = {}) {
  const { logger, traceContext } = context;

  if (logger) {
    logger.info('Action completed successfully');
  }

  if (traceContext && !traceContext.disabled) {
    traceContext.completedAt = Date.now();
    traceContext.duration = traceContext.completedAt - traceContext.startTime;
  }

  return response.success(data);
}

module.exports = {
  handleActionError,
  handleActionSuccess,
};
