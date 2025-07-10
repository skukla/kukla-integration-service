/**
 * Test Display Formatting Operations
 * Mid-level operations for formatting and displaying test results
 */

const { basicFormatters } = require('../../core/utils');
const { ICONS } = require('../../core/utils/output-constants');

/**
 * Display action execution status
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 */
function displayActionStatus(status, statusText) {
  if (status === 200) {
    console.log(basicFormatters.success('Action executed successfully'));
  } else {
    console.log(basicFormatters.error(`Action failed (${status}: ${statusText})`));
  }
}

/**
 * Display response storage information
 * @param {Object} responseData - Response data containing storage info
 */
function displayStorageInfo(responseData) {
  if (responseData && responseData.storage) {
    const { provider, location } = responseData.storage;
    const providerDisplay = provider === 's3' ? 'S3' : 'APP-BUILDER';
    const locationDisplay = provider === 's3' ? location.split('/')[0] : 'Adobe I/O Files';
    console.log(basicFormatters.info(`Storage: ${providerDisplay} (${locationDisplay})`));
  }
}

/**
 * Display download URL information
 * @param {string} downloadUrl - Download URL
 */
function displayDownloadInfo(downloadUrl) {
  if (downloadUrl) {
    console.log(basicFormatters.info(`Download: ${downloadUrl}`));
  }
}

/**
 * Display execution steps
 * @param {Array} steps - Array of execution steps
 */
function displaySteps(steps) {
  if (steps && Array.isArray(steps)) {
    steps.forEach((step, index) => {
      console.log(basicFormatters.step(`${index + 1}. ${step}`));
    });
  }
}

/**
 * Display performance metrics
 * @param {Object} performance - Performance data
 */
function displayPerformance(performance) {
  if (performance) {
    const { duration, requestCount, dataSize } = performance;
    if (duration) console.log(basicFormatters.muted(`⏱ Duration: ${duration}`));
    if (requestCount) console.log(basicFormatters.muted(`📊 Requests: ${requestCount}`));
    if (dataSize) console.log(basicFormatters.muted(`📏 Data Size: ${dataSize}`));
  }
}

/**
 * Display environment information
 * @param {string} actionUrl - Action URL
 * @param {string} environment - Environment name
 */
function displayEnvironmentInfo(actionUrl, environment) {
  const envSymbol = environment === 'production' ? '●' : '◉';
  console.log(basicFormatters.muted(`${envSymbol} Environment: ${environment}`));
  console.log(basicFormatters.muted(`${ICONS.api} ${actionUrl}`));
}

/**
 * Display execution steps
 * @param {Array} steps - Array of execution steps
 */
function displayExecutionSteps(steps) {
  if (steps && Array.isArray(steps)) {
    console.log(basicFormatters.info('Execution Steps:'));
    steps.forEach((step, index) => {
      console.log(basicFormatters.muted(`  ${index + 1}. ${step}`));
    });
  }
}

/**
 * Display performance metrics (alias for backward compatibility)
 * @param {Object} performance - Performance data
 */
function displayPerformanceMetrics(performance) {
  return displayPerformance(performance);
}

/**
 * Display message
 * @param {string} message - Message to display
 */
function displayMessage(message) {
  if (message) {
    console.log(basicFormatters.info(`${message}`));
  }
}

/**
 * Display error details
 * @param {Object} error - Error object
 */
function displayErrorDetails(error) {
  if (error) {
    console.log(basicFormatters.error(`${error.message || error}`));
    if (error.stack) {
      console.log(basicFormatters.muted(error.stack));
    }
  }
}

module.exports = {
  displayActionStatus,
  displayStorageInfo,
  displayDownloadInfo,
  displaySteps,
  displayPerformance,
  displayEnvironmentInfo,
  displayExecutionSteps,
  displayPerformanceMetrics,
  displayMessage,
  displayErrorDetails,
};
