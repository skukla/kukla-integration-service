/**
 * Test Domain - Response Handling Operations
 * Operations for processing and displaying test responses
 */

const { loadConfig } = require('../../../config');
const format = require('../../core/formatting');
const {
  isSuccessfulResponse,
  extractErrorMessage,
  formatStorageInfo,
} = require('../../core/utils/response');

/**
 * Display test results with immediate progress feedback
 * Shows only the response data since environment/action info was already displayed
 * @param {string} environment - Environment string
 * @param {string} actionName - Action name
 * @param {Object} response - HTTP response object
 * @returns {Object} Test result data
 */
function displayProgressResults(environment, actionName, response) {
  const isSuccess = isSuccessfulResponse(response);

  // Display storage info immediately
  displayStorageInfo(response.body);
  console.log();

  // Display status
  console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));

  // Display response content
  displayResponseContent(isSuccess, response.body);

  const errorMessage = isSuccess ? null : extractErrorMessage(response);
  return {
    success: isSuccess,
    environment,
    actionName,
    status: response.status,
    message: errorMessage,
    error: errorMessage,
  };
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

  const errorMessage = isSuccess ? null : extractErrorMessage(response);
  return {
    success: isSuccess,
    environment,
    actionName,
    status: response.status,
    message: errorMessage,
    error: errorMessage,
  };
}

/**
 * Display storage information from response
 * @param {Object} body - Response body
 */
function displayStorageInfo(body) {
  if (body && body.storage) {
    const storageInfo = formatStorageInfo(body.storage);
    console.log(format.storage(storageInfo));

    // Display file management info if available
    if (body.storage.management) {
      const mgmt = body.storage.management;
      const operation = mgmt.fileExisted ? '📝 Updated existing file' : '📄 Created new file';
      const urlStatus = mgmt.urlGenerated
        ? '(generated presigned URL)'
        : '(preserved existing presigned URL)';
      console.log(format.muted(`   ${operation} ${urlStatus}`));
    }
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
    const config = loadConfig({});
    const downloadUrl = body.downloadUrl.replace('REQUIRED:RUNTIME_URL', config.runtime.url);
    console.log(`   ${format.downloadUrl(downloadUrl)}`);
  }

  if (body.storage?.properties?.presigned?.success) {
    const presigned = body.storage.properties.presigned;
    console.log();
    console.log(format.downloadHeader('🌐 Presigned URL (Direct Access):'));
    console.log(`   ${format.downloadUrl(presigned.presignedUrl)}`);
    console.log(`   ${format.muted(`Expires: ${presigned.expiresAt} (${presigned.expiresIn}s)`)}`);
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
  return {
    success: false,
    error: errorMessage,
    actionName,
  };
}

module.exports = {
  isSuccessfulResponse,
  displayTestResults,
  displayProgressResults,
  buildErrorResult,
};
