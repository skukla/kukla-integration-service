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
 * Display test response data - Domain-specific formatting
 * @param {Object} response - HTTP response object
 * @param {boolean} isSuccess - Whether the test succeeded
 */
function displayResponseData(response, isSuccess) {
  if (!response.body || !isSuccess) return;

  try {
    const responseBody =
      typeof response.body === 'string' ? JSON.parse(response.body) : response.body;

    // Step 1: Display storage info
    if (responseBody.storage) {
      const storageType =
        responseBody.storage.provider === 's3' ? 'Amazon S3' : 'App Builder (Adobe I/O Files)';
      console.log(format.storage(storageType));
    }

    // Step 2: Display download URL
    if (responseBody.downloadUrl) {
      console.log();
      console.log(format.downloadUrl(responseBody.downloadUrl));
    }

    // Step 3: Display steps
    if (responseBody.steps && Array.isArray(responseBody.steps)) {
      console.log();
      console.log(format.section('Steps:'));
      console.log(format.steps(responseBody.steps));
    }
  } catch (error) {
    // Ignore JSON parsing errors in test context
  }
}

module.exports = {
  isSuccessfulResponse,
  displayResponseData,
};
