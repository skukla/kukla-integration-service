/**
 * Test Execution Operations
 * Test domain specific operations for action execution
 */

const { filterActionParameters, buildActionUrl, isSuccessfulResponse } = require('./index');

/**
 * Execute action test - Clean operation for Light DDD pattern
 * @param {string} actionName - Name of action to test
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether testing in production
 * @returns {Promise<Object>} Test response with success determination
 */
async function executeActionTest(actionName, params, isProd = false) {
  const actionUrl = buildActionUrl(actionName, params, isProd);
  const response = await testAction(actionUrl, params);

  return {
    ...response,
    success: isSuccessfulResponse(response),
    actionUrl,
  };
}

/**
 * Execute action test in raw mode - Simplified using shared functions
 * @param {string} actionName - Name of action to test
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether testing in production
 * @returns {Promise<Object>} Raw test result
 */
async function executeRawTest(actionName, params, isProd = false) {
  const actionUrl = buildActionUrl(actionName, params, isProd);
  const response = await testAction(actionUrl, params);

  return {
    success: isSuccessfulResponse(response),
    rawResponse: response,
    actionUrl,
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

  // Use business logic operation to filter parameters
  const actionParams = filterActionParameters(params);

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
  executeActionTest,
  executeRawTest,
  testAction,
};
