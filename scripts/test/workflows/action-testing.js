/**
 * Test Workflows
 * High-level orchestration for testing operations
 */

const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const { loadConfig } = require('../../../config');
const format = require('../../format');
const { testExecution } = require('../operations');

/**
 * Process parameters for specific actions to provide better UX
 * @param {string} actionName - The action being called
 * @param {Object} params - Raw parameters object
 * @returns {Object} Processed parameters
 */
function processActionParameters(actionName, params) {
  const processedParams = { ...params };

  // For delete-file action, automatically prepend storage directory to fileName if not already present
  if (actionName === 'delete-file' && processedParams.fileName) {
    try {
      const config = loadConfig(processedParams);
      const storageDirectory = config.storage.directory;
      if (!processedParams.fileName.startsWith(storageDirectory)) {
        processedParams.fileName = `${storageDirectory}${processedParams.fileName}`;
      }
    } catch (error) {
      // Fallback to default if config loading fails
      if (!processedParams.fileName.startsWith('public/')) {
        processedParams.fileName = `public/${processedParams.fileName}`;
      }
    }
  }

  // For get-products action, load Commerce URL from config and credentials from .env if not provided
  if (actionName === 'get-products') {
    // get-products action gets all configuration from inputs/environment variables
    // Don't send any parameters to avoid 400 "reserved properties" errors
    return processedParams;
  }

  return processedParams;
}

/**
 * Display rich action test results with detailed information
 * Uses centralized formatting from format domain
 * @param {Object} response - Action response
 * @param {string} actionName - Name of the action
 * @param {string} actionUrl - Action URL
 * @param {string} environment - Environment name
 */
function displayActionResults(response, actionName, actionUrl, environment) {
  // Use centralized display formatter
  format.display.displayActionResults(response, actionName, actionUrl, environment);
}

/**
 * Action testing workflow
 * @param {string} actionName - Name of action to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @returns {Promise<Object>} Test result
 */
async function actionTestingWorkflow(actionName, options = {}) {
  const { params = {}, rawOutput = false } = options;

  try {
    // Process parameters for the specific action
    const processedParams = processActionParameters(actionName, params);

    // Handle environment detection
    testExecution.handleEnvironmentDetection(processedParams, rawOutput);

    if (rawOutput) {
      // Raw mode: just return response data
      return await testExecution.executeRawTest(actionName, processedParams);
    } else {
      // Enhanced mode: user-friendly output with rich display
      return await testExecution.executeEnhancedTest(
        actionName,
        processedParams,
        displayActionResults
      );
    }
  } catch (error) {
    throw new Error(`Action test failed: ${error.message}`);
  }
}

/**
 * Get available actions from app.config.yaml
 * @returns {Array} List of available action names
 */
function getAvailableActions() {
  try {
    const config = yaml.load(
      fs.readFileSync(path.join(__dirname, '../../../app.config.yaml'), 'utf8')
    );
    return Object.keys(
      config.application.runtimeManifest.packages['kukla-integration-service'].actions
    );
  } catch (error) {
    return [];
  }
}

module.exports = {
  actionTestingWorkflow,
  processActionParameters,
  getAvailableActions,
};
