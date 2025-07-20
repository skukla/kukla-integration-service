/**
 * Testing Output Utilities
 * Complete test result formatting and debugging output capabilities
 */

const { success, error, subInfo } = require('../../scripts/shared/formatting');

// Test Output Workflows

/**
 * Display comprehensive test results
 * @purpose Format and display test results with context and debugging information
 * @param {Object} testResult - Test result object
 * @returns {void} Outputs formatted results to console
 * @usedBy Test scripts, action testing workflows
 */
function displayTestResults(testResult) {
  // Display success or error results
  if (testResult.success) {
    displaySuccessResults(testResult);
  } else {
    displayFailureResults(testResult);
  }
}

// Test Output Operations

/**
 * Display successful test results
 * @purpose Format and show successful test response data
 * @param {Object} testResult - Successful test result
 * @returns {void} Outputs success information to console
 * @usedBy displayTestResults
 */
function displaySuccessResults(testResult) {
  const responseBody = testResult.response?.data || testResult.data || testResult;

  console.log(success('Status: SUCCESS (200)'));

  // Display response content if available
  if (responseBody) {
    displaySuccessContent(responseBody);
  }
}

/**
 * Display failed test results with debugging information
 * @purpose Format and show error details with enhanced debugging context
 * @param {Object} testResult - Failed test result
 * @returns {void} Outputs error information to console
 * @usedBy displayTestResults
 */
function displayFailureResults(testResult) {
  const errorMessage = extractErrorMessage(testResult);
  console.log(error(errorMessage));
}

// Test Output Utilities

/**
 * Display successful response content
 * @purpose Format successful response data for display
 * @param {Object} responseBody - Response body to display
 * @returns {void} Outputs formatted response content
 * @usedBy displaySuccessResults
 */
function displaySuccessContent(responseBody) {
  // Display storage info if available
  if (responseBody.storage) {
    displayStorageInfo(responseBody.storage);
  }

  // Display other response content
  if (responseBody.message) {
    console.log(subInfo(`Message: ${responseBody.message}`));
  }

  if (responseBody.steps && Array.isArray(responseBody.steps)) {
    console.log(subInfo('Steps completed:'));
    responseBody.steps.forEach((step) => {
      console.log(subInfo(`  • ${step}`));
    });
  }
}

/**
 * Display enhanced debugging information for test failures
 * @purpose Show additional context when tests fail to aid debugging
 * @param {Object} testResult - Test result object
 * @returns {void} Outputs debugging information to console
 * @usedBy displayFailureResults
 */
function displayErrorDebugInfo(testResult) {
  // Show response status if available
  if (testResult.response?.statusCode) {
    console.log(subInfo(`HTTP Status: ${testResult.response.statusCode}`));
  }

  // Show response body for additional context
  if (testResult.response?.data) {
    const responseData = testResult.response.data;
    if (typeof responseData === 'object') {
      console.log(subInfo(`Response: ${JSON.stringify(responseData, null, 2)}`));
    } else {
      console.log(subInfo(`Response: ${responseData}`));
    }
  }

  // Show validation errors if available
  if (testResult.validation?.errors?.length > 0) {
    console.log(subInfo('Validation errors:'));
    testResult.validation.errors.forEach((errorItem) => {
      console.log(subInfo(`  • ${errorItem}`));
    });
  }

  // Show timing information for performance context
  if (testResult.timing?.responseTime) {
    console.log(subInfo(`Response time: ${testResult.timing.responseTime}ms`));
  }
}

/**
 * Extract error message from test result
 * @purpose Get the most relevant error message from multiple possible sources
 * @param {Object} testResult - Test result object
 * @returns {string} Error message
 * @usedBy displayFailureResults
 */
function extractErrorMessage(testResult) {
  // Primary: Detailed error from action response (JSON body)
  if (testResult.data?.error) {
    return testResult.data.error;
  }

  // Secondary: Direct error from test execution
  if (testResult.error) {
    return testResult.error;
  }

  // Tertiary: Validation error (different type of error)
  if (testResult.validation?.errors?.length > 0) {
    return testResult.validation.errors[0];
  }

  return 'Unknown error occurred';
}

/**
 * Display storage information
 * @purpose Format storage details for display
 * @param {Object} storage - Storage information
 * @returns {void} Outputs storage information
 * @usedBy displaySuccessContent
 */
function displayStorageInfo(storage) {
  if (typeof storage === 'string') {
    console.log(subInfo(`Storage: ${storage}`));
  } else if (storage.provider) {
    console.log(subInfo(`Storage: ${storage.provider}`));
  }
}

module.exports = {
  displayTestResults,
  displaySuccessResults,
  displayFailureResults,
  displayErrorDebugInfo,
  extractErrorMessage,
};
