/**
 * Test Execution Operations
 * Test domain specific operations for action execution
 */

const { isSuccessfulResponse } = require('./response-handling');
const { buildActionUrl } = require('./url-building');
const { makeJsonPostRequest } = require('../../core/utils/http');
const { filterActionParameters } = require('../../core/utils/parameters');

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
  const actionParams = filterActionParameters(params);

  return await makeJsonPostRequest(actionUrl, actionParams);
}

module.exports = {
  executeActionTest,
  executeRawTest,
  testAction,
};
