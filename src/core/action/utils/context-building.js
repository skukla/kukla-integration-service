/**
 * Core Action - Context Building Utilities
 * Utility functions for building action execution contexts
 */

/**
 * Build action context from initialized components
 * @param {Object} components - Initialized action components
 * @param {Object} components.config - Configuration object
 * @param {Object} components.params - Action parameters
 * @param {Object} components.traceContext - Tracing context
 * @param {Object} components.logger - Logger instance
 * @param {Object} components.domainCatalogs - Domain catalogs
 * @param {Object} components.response - Response utilities
 * @returns {Object} Action context
 */
function buildActionContext(components) {
  const { config, params, traceContext, logger, domainCatalogs, response } = components;

  return {
    config,
    params,
    traceContext,
    logger,
    domainCatalogs,
    response,
  };
}

module.exports = {
  buildActionContext,
};
