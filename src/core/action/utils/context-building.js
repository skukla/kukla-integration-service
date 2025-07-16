/**
 * Core Action - Context Building Utilities
 * Utility functions for building action execution contexts
 */

const response = require('../../http/responses');
const { formatStepMessage } = require('../../utils/operations/formatting');

/**
 * Build action context from initialized components
 * @param {Object} components - Initialized action components
 * @param {Object} components.config - Configuration object
 * @param {Object} components.extractedParams - Extracted action parameters
 * @param {Object} components.rawParams - Raw parameters from Adobe I/O Runtime
 * @param {Object} components.logger - Logger instance
 * @param {Object} components.options - Initialization options
 * @returns {Object} Action context
 */
function buildContext(components) {
  const { config, extractedParams, rawParams, logger, options } = components;

  return {
    config,
    extractedParams,
    rawParams,
    logger,
    options,
    response,
    core: {
      formatStepMessage,
    },
  };
}

/**
 * Build action context from initialized components (legacy name)
 * @deprecated Use buildContext instead
 * @param {Object} components - Initialized action components
 * @returns {Object} Action context
 */
function buildActionContext(components) {
  console.warn('buildActionContext is deprecated. Use buildContext instead.');
  return buildContext(components);
}

module.exports = {
  buildContext,
  buildActionContext,
};
