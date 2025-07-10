/**
 * Test Execution Operations
 * Mid-level operations for test execution and environment handling
 */

const { loadConfig } = require('../../../config');
const { buildRuntimeUrl } = require('../../../src/core/routing');
const core = require('../../core');

/**
 * Handle environment detection with spinner feedback
 * @param {Object} processedParams - Processed parameters object
 * @param {boolean} rawOutput - Whether in raw output mode
 * @returns {string} Detected environment
 */
function handleEnvironmentDetection(processedParams, rawOutput) {
  if (!processedParams.NODE_ENV && !process.env.NODE_ENV) {
    if (!rawOutput) {
      const envSpinner = core.createSpinner('Detecting workspace environment...');
      try {
        processedParams.NODE_ENV = core.detectScriptEnvironment(processedParams, {
          allowCliDetection: true,
        });
        const capitalizedEnv = core.capitalize(processedParams.NODE_ENV);
        core.succeedSpinner(envSpinner, `Environment: ${capitalizedEnv}`);
      } catch (error) {
        envSpinner.fail('Environment detection failed, defaulting to production');
        processedParams.NODE_ENV = 'production';
      }
    } else {
      processedParams.NODE_ENV = core.detectScriptEnvironment(processedParams, {
        allowCliDetection: true,
      });
    }
  }
  return processedParams.NODE_ENV;
}

/**
 * Execute action test in raw mode
 * @param {string} actionName - Name of action to test
 * @param {Object} processedParams - Processed parameters
 * @returns {Promise<Object>} Raw test result
 */
async function executeRawTest(actionName, processedParams) {
  const config = loadConfig(processedParams);
  const actionUrl = buildRuntimeUrl(actionName, null, config);
  const response = await testAction(actionUrl, processedParams);

  return {
    success: response.status === 200,
    rawResponse: response,
    actionUrl,
  };
}

/**
 * Execute action test in enhanced mode with display
 * @param {string} actionName - Name of action to test
 * @param {Object} processedParams - Processed parameters
 * @param {Function} displayActionResults - Display function
 * @returns {Promise<Object>} Enhanced test result
 */
async function executeEnhancedTest(actionName, processedParams, displayActionResults) {
  const testSpinner = core.createSpinner(`Testing action: ${actionName}`);

  const config = loadConfig(processedParams);
  const actionUrl = buildRuntimeUrl(actionName, null, config);
  const response = await testAction(actionUrl, processedParams);

  core.succeedSpinner(testSpinner, 'Action response received');

  // Display rich results
  displayActionResults(response, actionName, actionUrl, processedParams.NODE_ENV);

  return {
    success: response.status === 200,
    actionName,
    actionUrl,
    response,
    environment: processedParams.NODE_ENV,
    status: response.status,
    statusText: response.statusText,
  };
}

/**
 * Test an action by calling its runtime URL
 * @param {string} actionUrl - Full action URL
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Test result
 */
async function testAction(actionUrl, params) {
  const fetch = require('node-fetch');

  // Filter out reserved/system properties that shouldn't be sent to actions
  const reservedProperties = ['NODE_ENV'];
  const actionParams = Object.keys(params)
    .filter((key) => !reservedProperties.includes(key))
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});

  const response = await fetch(actionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(actionParams),
  });

  const responseBody = await response.json();

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
  };
}

module.exports = {
  handleEnvironmentDetection,
  executeRawTest,
  executeEnhancedTest,
  testAction,
};
