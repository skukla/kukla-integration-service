/**
 * Core Action - Initialization Operations
 * Business logic for action initialization and context building
 */

const { loadConfig } = require('../../../../config');
const { extractActionParams } = require('../../http/operations/params');
const response = require('../../http/responses');
const { buildContext } = require('../utils/context-building');
const { setupLogger } = require('../utils/logger-setup');

/**
 * Initialize action execution environment
 * Main orchestration for action initialization with configuration and context.
 *
 * @param {Object} params - Action parameters from Adobe I/O Runtime
 * @param {Object} [options] - Initialization options
 * @param {boolean} [options.skipValidation] - Skip input validation
 * @returns {Promise<Object>} Initialized action context or error response
 */
async function initializeAction(params, options = {}) {
  try {
    // Step 1: Load configuration and extract parameters
    const config = loadConfig(params);
    const extractedParams = extractActionParams(params);

    // Step 2: Setup logging with extracted parameters
    const logger = setupLogger(extractedParams);

    // Step 3: Build base context without domain loading
    const context = await buildContext({
      config,
      extractedParams,
      logger,
      options,
    });

    return context;
  } catch (error) {
    return {
      error: true,
      response: response.error(error.message),
    };
  }
}

/**
 * Validates basic action parameters
 * Pure function that checks for required parameters.
 *
 * @param {Object} params - Action parameters
 * @returns {boolean} True if parameters are valid
 */
function validateActionParams(params) {
  if (!params || typeof params !== 'object') {
    return false;
  }

  // Basic validation - specific validation should be done in business logic
  return true;
}

/**
 * Creates action initialization configuration
 * Pure function that creates initialization options.
 *
 * @param {Object} options - Custom options
 * @returns {Object} Initialization configuration
 */
function createInitializationConfig(options = {}) {
  return {
    skipValidation: false,
    ...options,
  };
}

/**
 * Initializes action with error handling and validation
 * Complete initialization workflow with comprehensive error handling.
 *
 * @param {Object} params - Action parameters
 * @param {Object} [options] - Initialization options
 * @returns {Promise<Object>} Action context or error response
 */
async function initializeActionSafely(params, options = {}) {
  try {
    // Validate basic parameters
    if (!validateActionParams(params)) {
      throw new Error('Invalid action parameters provided');
    }

    // Create initialization configuration
    const initConfig = createInitializationConfig(options);

    // Initialize action
    return await initializeAction(params, initConfig);
  } catch (error) {
    return {
      error: true,
      response: response.error(`Action initialization failed: ${error.message}`),
    };
  }
}

/**
 * Initialize action context for testing
 * Test-specific initialization that includes additional debugging info.
 *
 * @param {Object} params - Action parameters
 * @param {Object} [options] - Test options
 * @returns {Promise<Object>} Test action context
 */
async function initializeTestAction(params, options = {}) {
  const testOptions = {
    ...options,
    testing: true,
    debugMode: true,
  };

  const result = await initializeAction(params, testOptions);

  if (result.error) {
    return result;
  }

  // Add test-specific context
  result.testing = true;
  result.startTime = Date.now();

  return result;
}

/**
 * Get action initialization metrics
 * Utility function for performance monitoring of action initialization.
 *
 * @param {Object} context - Action context
 * @returns {Object} Initialization metrics
 */
function getInitializationMetrics(context) {
  return {
    initializationTime: context.initTime || 0,
    configurationSize: context.config ? Object.keys(context.config).length : 0,
    hasLogger: !!context.logger,
    hasParams: !!context.extractedParams,
    testing: !!context.testing,
  };
}

module.exports = {
  initializeAction,
  validateActionParams,
  createInitializationConfig,
  initializeActionSafely,
  initializeTestAction,
  getInitializationMetrics,
};
