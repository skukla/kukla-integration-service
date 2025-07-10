/**
 * Format Domain Display Formatters
 * Comprehensive display formatting operations for all script output needs
 * Centralizes formatting logic from action-testing and other scattered locations
 */

const { ICONS, COLORS, SPACING } = require('../utils/constants');

/**
 * Display action execution status with consistent formatting
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 */
function displayActionStatus(status, statusText) {
  if (status === 200) {
    console.log(COLORS.success(`${ICONS.success} Action executed successfully`));
  } else {
    console.log(COLORS.error(`${ICONS.error} Action failed (${status}: ${statusText})`));
  }
}

/**
 * Display environment information with consistent formatting
 * @param {string} actionUrl - Action URL
 * @param {string} environment - Environment name
 */
function displayEnvironmentInfo(actionUrl, environment) {
  const envSymbol = environment === 'production' ? '●' : '◉';
  const capitalizedEnv = environment.charAt(0).toUpperCase() + environment.slice(1);
  console.log(COLORS.muted(`${envSymbol} Environment: ${capitalizedEnv}`));
  console.log(COLORS.muted(`${ICONS.api} ${actionUrl}`));
}

/**
 * Display execution steps with consistent formatting
 * @param {Array} steps - Array of execution steps
 */
function displayExecutionSteps(steps) {
  if (steps && Array.isArray(steps)) {
    console.log(COLORS.info('Execution Steps:'));
    steps.forEach((step, index) => {
      console.log(COLORS.success(`${index + 1}. ${step}`));
    });
  }
}

/**
 * Display storage information with consistent formatting
 * @param {Object} responseData - Response data containing storage info
 */
function displayStorageInfo(responseData) {
  if (responseData && responseData.storage) {
    const { provider, location } = responseData.storage;
    const providerDisplay = provider === 's3' ? 'S3' : 'APP-BUILDER';

    let locationDisplay;
    if (provider === 's3') {
      // For S3, extract bucket name from location if it's a string with prefix
      if (typeof location === 'string' && location.includes('/')) {
        locationDisplay = location.split('/')[0];
      } else {
        locationDisplay = 'kukla-integration'; // Fallback to known prefix
      }
    } else {
      locationDisplay = 'Adobe I/O Files';
    }

    console.log(COLORS.info(`Storage: ${providerDisplay} (${locationDisplay})`));
  }
}

/**
 * Display download URL information with consistent formatting
 * @param {string} downloadUrl - Download URL
 */
function displayDownloadInfo(downloadUrl) {
  if (downloadUrl) {
    console.log(COLORS.info(`Download: ${downloadUrl}`));
  }
}

/**
 * Display performance metrics with consistent formatting
 * @param {Object} performance - Performance data
 */
function displayPerformanceMetrics(performance) {
  if (performance) {
    const { duration, requestCount, dataSize } = performance;
    if (duration) console.log(COLORS.muted(`⏱ Duration: ${duration}`));
    if (requestCount) console.log(COLORS.muted(`📊 Requests: ${requestCount}`));
    if (dataSize) console.log(COLORS.muted(`📏 Data Size: ${dataSize}`));
  }
}

/**
 * Display message with consistent formatting
 * @param {string} message - Message to display
 */
function displayMessage(message) {
  if (message) {
    console.log(COLORS.info(`${message}`));
  }
}

/**
 * Display error details with consistent formatting
 * @param {Object} error - Error object
 */
function displayErrorDetails(error) {
  if (error) {
    console.log(COLORS.error(`${error.message || error}`));
    if (error.stack) {
      console.log(COLORS.muted(error.stack));
    }
  }
}

/**
 * Display rich action test results with detailed information
 * Centralized version of the logic from action-testing workflow
 * @param {Object} response - Action response
 * @param {string} actionName - Name of the action
 * @param {string} actionUrl - Action URL
 * @param {string} environment - Environment name
 */
function displayActionResults(response, actionName, actionUrl, environment) {
  const { status, statusText, body } = response;

  // Add spacing before results
  console.log('');

  // Display status and environment info
  displayActionStatus(status, statusText);
  displayEnvironmentInfo(actionUrl, environment);

  // Display response details if successful
  if (status === 200 && body) {
    displayExecutionSteps(body.steps);
    displayStorageInfo(body);
    displayDownloadInfo(body.downloadUrl);
    displayPerformanceMetrics(body.performance);
    displayMessage(body.message);
  } else if (body && body.error) {
    displayErrorDetails(body.error);
  }

  // Add spacing after results
  console.log('');
}

/**
 * Display verbose information with consistent formatting
 * @param {string} message - Verbose message
 */
function displayVerboseInfo(message) {
  console.log(COLORS.info(message));
}

/**
 * Display step completion with consistent formatting
 * @param {string} stepName - Name of the completed step
 */
function displayStepCompletion(stepName) {
  console.log(COLORS.success(`${ICONS.complete} ${stepName}`));
}

/**
 * Display warning message with consistent formatting
 * @param {string} message - Warning message
 */
function displayWarning(message) {
  console.log(COLORS.warning(`${ICONS.warning} ${message}`));
}

/**
 * Display info message with consistent formatting
 * @param {string} message - Info message
 */
function displayInfo(message) {
  console.log(COLORS.info(`${ICONS.info} ${message}`));
}

/**
 * Display section header with consistent formatting
 * @param {string} title - Section title
 * @param {string} subtitle - Optional subtitle
 */
function displaySectionHeader(title, subtitle = '') {
  console.log(COLORS.header(`${SPACING.beforeSection}${title}${SPACING.afterSection}`));
  if (subtitle) {
    console.log(COLORS.muted(subtitle));
  }
}

module.exports = {
  // Action testing formatters
  displayActionStatus,
  displayEnvironmentInfo,
  displayExecutionSteps,
  displayStorageInfo,
  displayDownloadInfo,
  displayPerformanceMetrics,
  displayMessage,
  displayErrorDetails,
  displayActionResults,

  // General workflow formatters
  displayVerboseInfo,
  displayStepCompletion,
  displayWarning,
  displayInfo,
  displaySectionHeader,
};
