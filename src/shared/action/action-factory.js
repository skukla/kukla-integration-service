/**
 * Core Action - Action Factory Operations
 * Factory function for creating standardized Adobe I/O Runtime actions
 */

const { wrapAction } = require('./action-execution');

/**
 * Creates a standardized action with direct imports
 * Actions use direct imports from domain operations instead of domain catalogs.
 *
 * @param {Function} businessLogic - The core business logic function
 * @param {Object} actionOptions - Action configuration
 * @param {string} actionOptions.actionName - Name of the action
 * @param {boolean} [actionOptions.withLogger] - Enable logging
 * @param {string} [actionOptions.description] - Action description
 * @returns {Object} Action module with main function
 */
function createAction(businessLogic, actionOptions = {}) {
  const { actionName, withLogger = false, description = '' } = actionOptions;

  const main = async (params) => {
    return wrapAction(businessLogic, params, {
      actionName,
      withLogger,
    });
  };

  return {
    main,
    // Export metadata for documentation/tooling
    meta: {
      name: actionName,
      description,
      withLogger,
    },
  };
}

module.exports = {
  createAction,
};
