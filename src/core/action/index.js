/**
 * Action Framework - Core Infrastructure for Adobe I/O Runtime Actions
 * @module core/action
 *
 * Provides standardized action initialization, error handling, and response patterns
 * to eliminate duplication across actions.
 */

const { Core } = require('@adobe/aio-sdk');

const { loadConfig } = require('../../../config');
const { extractActionParams } = require('../http/client');
const { response } = require('../http/responses');
const { createTraceContext } = require('../tracing');

/**
 * Standard action initialization that handles all common setup
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {Object} options - Initialization options
 * @param {string} options.actionName - Name of the action (for tracing)
 * @param {Array<string>} [options.domains] - Domain catalogs to import ['products', 'files', 'commerce']
 * @param {boolean} [options.withTracing=false] - Enable tracing context
 * @param {boolean} [options.withLogger=false] - Enable logger setup
 * @param {string} [options.logLevel='info'] - Logger level
 * @returns {Promise<Object>} Initialized action context
 */
async function initializeAction(params, options = {}) {
  const {
    actionName,
    domains = [],
    withTracing = false,
    withLogger = false,
    logLevel = 'info',
  } = options;

  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    const { success } = require('../http/responses');
    return {
      preflight: true,
      response: success({}, 'Preflight success', {}),
    };
  }

  // Extract and load configuration
  const actionParams = extractActionParams(params);
  const config = loadConfig(actionParams);

  // Initialize context
  const context = {
    extractedParams: actionParams, // Processed OAuth credentials & normalized names
    config,
    webActionParams: params, // Raw Adobe I/O Runtime parameters (includes __ow_* metadata)
  };

  // Set up logger if requested
  if (withLogger) {
    context.logger = Core.Logger(actionName || 'action', {
      level: params.LOG_LEVEL || logLevel,
    });
  }

  // Set up tracing if requested
  if (withTracing && actionName) {
    context.trace = createTraceContext(actionName, config, actionParams);
  }

  // Import requested domain catalogs
  if (domains && domains.length > 0) {
    const domainCatalogs = {};
    const mainCatalog = require('../../index');

    domains.forEach((domain) => {
      if (mainCatalog[domain]) {
        domainCatalogs[domain] = mainCatalog[domain];
      }
    });

    context.domains = domainCatalogs;

    // Also provide flat access for convenience
    Object.assign(context, domainCatalogs);
  }

  // Always include core utilities
  context.core = {
    formatStepMessage: require('../utils/operations/formatting').formatStepMessage,
    checkMissingParams: require('../validation/operations/parameters').checkMissingParams,
    success: require('../http/responses').success,
    error: require('../http/responses').error,
  };

  return context;
}

/**
 * Wraps an action function with standard error handling and response formatting
 * @param {Function} actionFn - The action function to wrap
 * @param {Object} [options] - Wrapper options
 * @param {string} [options.actionName] - Action name for logging
 * @returns {Function} Wrapped action function
 */
function wrapAction(actionFn, options = {}) {
  const { actionName } = options;

  return async function wrappedAction(params) {
    try {
      return await actionFn(params);
    } catch (error) {
      // Log error with action context
      if (actionName) {
        console.error(`Error in ${actionName}:`, error);
      } else {
        console.error('Action error:', error);
      }

      // Return standardized error response
      return response.error(error, {});
    }
  };
}

/**
 * Creates a standardized action with common patterns
 * @param {Function} businessLogic - The core business logic function
 * @param {Object} actionOptions - Action configuration
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

  const main = wrapAction(
    async (params) => {
      // Initialize action context
      const context = await initializeAction(params, {
        actionName,
        domains,
        withTracing,
        withLogger,
      });

      // Handle preflight early return
      if (context.preflight) {
        return context.response;
      }

      // Execute business logic with context
      return await businessLogic(context);
    },
    { actionName }
  );

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

/**
 * Standardized step execution with consistent messaging
 * @param {Array} steps - Steps array to update
 * @param {string} stepName - Name of the step
 * @param {Function} stepFn - Function to execute
 * @param {Object} [context] - Action context (for tracing)
 * @returns {Promise<any>} Step result
 */
async function executeStep(steps, stepName, stepFn, context = {}) {
  const { trace, core } = context;

  let result;

  if (trace && core?.traceStep) {
    // Execute with tracing
    result = await core.traceStep(trace, stepName, stepFn);
  } else {
    // Execute without tracing
    result = await stepFn();
  }

  // Add step message
  if (core?.formatStepMessage) {
    const stepMessage = core.formatStepMessage(stepName, 'success', {
      result: result?.length || result?.total_count || result?.count,
    });
    steps.push(stepMessage);
  }

  return result;
}

module.exports = {
  initializeAction,
  wrapAction,
  createAction,
  executeStep,
};
