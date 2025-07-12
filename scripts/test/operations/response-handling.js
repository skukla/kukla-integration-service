/**
 * Test Domain - Response Handling Operations
 * Operations for processing and displaying test responses
 */

const format = require('../../core/formatting');

/**
 * Determine if HTTP response indicates success for testing
 * Domain-specific version with test-focused success criteria
 * @param {Object} response - HTTP response object
 * @returns {boolean} True if successful response
 */
function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
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

  // Display URL and storage info
  console.log(format.url(response.actionUrl));
  displayStorageInfo(response.body);
  console.log(); // Add blank line before status

  // Display status
  console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));

  // Display response content
  displayResponseContent(isSuccess, response.body);

  return {
    success: isSuccess,
    environment,
    actionName,
    status: response.status,
    message: isSuccess ? null : response.body?.error || 'Test failed',
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
    console.log(format.section(`Message: ${body.message}`));
  }

  if (body.downloadUrl) {
    console.log();
    console.log(format.section('🔗 Download URL:'));
    console.log(`   ${body.downloadUrl}`);
  }

  if (body.steps && Array.isArray(body.steps)) {
    console.log();
    console.log(format.section('Steps:'));
    body.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
  }
}

/**
 * Format storage information for display
 * @param {Object} storage - Storage object from response
 * @returns {string} Formatted storage information
 */
function formatStorageInfo(storage) {
  const { provider, properties } = storage;

  if (!provider) {
    return 'Unknown Storage';
  }

  let info;
  if (provider === 'app-builder') {
    info = 'App Builder (Adobe I/O Files)';
  } else if (provider === 's3') {
    info = 'Amazon S3';
    if (properties?.bucket) {
      info += ` (${properties.bucket})`;
    }
  } else if (provider === 'error') {
    info = 'Storage Failed';
  } else {
    info = provider.toUpperCase();
  }

  return info;
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
