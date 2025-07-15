/**
 * Core Action - Initialization Operations
 * Core business logic for Adobe I/O Runtime action initialization
 */

const { loadDomainCatalogs } = require('./domain-loading');
const { loadConfig } = require('../../../../config');
const { extractActionParams } = require('../../http/client');
const { response } = require('../../http/responses');
const { createTraceContext } = require('../../tracing/operations/context');
const { buildActionContext } = require('../utils/context-building');
const { setupLogger } = require('../utils/logger-setup');

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

  try {
    // Step 1: Initialize configuration
    const config = loadConfig(params);
    const actionParams = extractActionParams(params);

    // Step 2: Initialize tracing context if requested
    let traceContext = null;
    if (withTracing) {
      traceContext = createTraceContext(actionName, config, actionParams);
    }

    // Step 3: Initialize logger if requested
    let logger = null;
    if (withLogger) {
      logger = setupLogger(actionName, logLevel);
    }

    // Step 4: Load domain catalogs
    const domainCatalogs = await loadDomainCatalogs(domains);

    // Step 5: Build and return action context
    return buildActionContext({
      config,
      params: actionParams,
      traceContext,
      logger,
      domainCatalogs,
      response,
    });
  } catch (error) {
    return {
      error: error.message,
      response: response.error(error.message),
    };
  }
}

/**
 * Simplified action initialization without domain catalogs
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Basic action context
 */
async function initializeSimpleAction(params, options = {}) {
  return initializeAction(params, { ...options, domains: [] });
}

/**
 * Action initialization with full tracing and logging
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {string} actionName - Name of the action (for tracing)
 * @param {Array<string>} [domains] - Domain catalogs to import
 * @returns {Promise<Object>} Fully initialized action context
 */
async function initializeFullAction(params, actionName, domains = []) {
  return initializeAction(params, {
    actionName,
    domains,
    withTracing: true,
    withLogger: true,
  });
}

/**
 * Action initialization with products domain (common use case)
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {string} actionName - Name of the action (for tracing)
 * @returns {Promise<Object>} Products action context
 */
async function initializeProductsAction(params, actionName) {
  return initializeAction(params, {
    actionName,
    domains: ['products'],
    withTracing: true,
    withLogger: true,
  });
}

/**
 * Action initialization with files domain (common use case)
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {string} actionName - Name of the action (for tracing)
 * @returns {Promise<Object>} Files action context
 */
async function initializeFilesAction(params, actionName) {
  return initializeAction(params, {
    actionName,
    domains: ['files'],
    withTracing: true,
    withLogger: true,
  });
}

/**
 * Action initialization with commerce domain (common use case)
 * @param {Object} params - Raw action parameters from Adobe I/O Runtime
 * @param {string} actionName - Name of the action (for tracing)
 * @returns {Promise<Object>} Commerce action context
 */
async function initializeCommerceAction(params, actionName) {
  return initializeAction(params, {
    actionName,
    domains: ['commerce'],
    withTracing: true,
    withLogger: true,
  });
}

module.exports = {
  initializeAction,
  initializeSimpleAction,
  initializeFullAction,
  initializeProductsAction,
  initializeFilesAction,
  initializeCommerceAction,
};
