/**
 * Test Domain - Response Handling Operations
 * Operations for processing and displaying test responses
 */

const format = require('../../core/formatting');
const { response: responseUtils } = require('../../core/utils');

/**
 * Determine if HTTP response indicates success for testing
 * Domain-specific version with test-focused success criteria
 * @param {Object} response - HTTP response object
 * @returns {boolean} True if successful response
 */
function isSuccessfulResponse(response) {
  return responseUtils.isSuccessfulResponse(response);
}

/**
 * Display complete test results - Comprehensive operation
 * @param {string} environment - Environment string
 * @param {string} actionName - Action name
 * @param {Object} response - HTTP response object
 * @returns {Object} Test result data
 */
function displayTestResults(environment, actionName, response) {
  const isSuccess = isSuccessfulResponse(response);

  // Display environment and action info
  console.log(format.success(`Environment detected: ${format.environment(environment)}`));
  console.log(format.success(`Action tested: ${actionName}`));
  console.log();

  // Display URL and storage info
  console.log(format.url(response.actionUrl));
  displayStorageInfo(response.body);
  console.log();

  // Display status
  console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));

  // Display response content
  displayResponseContent(isSuccess, response.body);

  return {
    success: isSuccess,
    environment,
    actionName,
    status: response.status,
    message: isSuccess ? null : responseUtils.extractErrorMessage(response),
  };
}

/**
 * Display storage information from response
 * @param {Object} body - Response body
 */
function displayStorageInfo(body) {
  if (body && body.storage) {
    const storageInfo = responseUtils.formatStorageInfo(body.storage);
    console.log(format.storage(storageInfo));
  }
}

/**
 * Display response content based on success/failure
 * @param {boolean} isSuccess - Whether the test was successful
 * @param {Object} body - Response body
 */
function displayResponseContent(isSuccess, body) {
  if (isSuccess && body) {
    displaySuccessContent(body);
  } else if (!isSuccess && body && body.error) {
    console.log(format.section(`Error: ${body.error}`));
  }
}

/**
 * Display success response content details
 * @param {Object} body - Response body
 */
function displaySuccessContent(body) {
  if (body.message) {
    console.log(`${format.messageLabel('Message:')} ${body.message}`);
  }

  if (body.downloadUrl) {
    console.log();
    console.log(format.downloadHeader('🔗 Download URL:'));
    console.log(`   ${format.downloadUrl(body.downloadUrl)}`);
  }

  if (body.steps && Array.isArray(body.steps)) {
    console.log();
    console.log(format.stepsHeader('Steps:'));
    body.steps.forEach((step, index) => {
      console.log(format.step(`${index + 1}. ${step}`));
    });
  }
}

/**
 * Build error result object - Operation for consistent error handling
 * @param {string} errorMessage - Error message
 * @param {string} actionName - Action name
 * @returns {Object} Error result
 */
function buildErrorResult(errorMessage, actionName) {
  // Display error through operations
  console.log(format.error(`Action test failed: ${errorMessage}`));

  return {
    success: false,
    error: errorMessage,
    actionName,
  };
}

module.exports = {
  isSuccessfulResponse,
  displayTestResults,
  buildErrorResult,
};
