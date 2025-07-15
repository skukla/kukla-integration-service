/**
 * Core Action - Action Execution Workflow
 * High-level orchestration for action execution with error handling
 */

const { handleActionError, handleActionSuccess } = require('../operations/error-handling');
const { initializeAction } = require('../operations/initialization');

/**
 * Generic action wrapper with error handling
 * @param {Function} actionFunction - The action function to execute
 * @param {Object} params - Action parameters
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Action response
 */
async function wrapAction(actionFunction, params, options = {}) {
  try {
    const context = await initializeAction(params, options);

    if (context.error) {
      return context.response;
    }

    const result = await actionFunction(context);
    return handleActionSuccess(result, context);
  } catch (error) {
    return handleActionError(error);
  }
}

module.exports = {
  wrapAction,
};
