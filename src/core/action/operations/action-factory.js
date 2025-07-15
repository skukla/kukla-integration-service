/**
 * Core Action - Action Factory Operations
 * Factory function for creating standardized Adobe I/O Runtime actions
 */

const { wrapAction } = require('../workflows/action-execution');

/**
 * Creates a standardized action with common patterns
 * @param {Function} businessLogic - The core business logic function
 * @param {Object} actionOptions - Action configuration
 * @param {string} actionOptions.actionName - Name of the action
 * @param {Array<string>} [actionOptions.domains] - Domain catalogs to import
 * @param {boolean} [actionOptions.withTracing] - Enable tracing
 * @param {boolean} [actionOptions.withLogger] - Enable logging
 * @param {string} [actionOptions.description] - Action description
 * @returns {Object} Action module with main function
 */
function createAction(businessLogic, actionOptions = {}) {
  const {
    actionName,
    domains = [],
    withTracing = false,
    withLogger = false,
    description = '',
  } = actionOptions;

  const main = async (params) => {
    return wrapAction(businessLogic, params, {
      actionName,
      domains,
      withTracing,
      withLogger,
    });
  };

  return {
    main,
    // Export metadata for documentation/tooling
    meta: {
      name: actionName,
      description,
      domains,
      withTracing,
      withLogger,
    },
  };
}

module.exports = {
  createAction,
};
