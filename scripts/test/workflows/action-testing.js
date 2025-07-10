/**
 * Test Workflows
 * High-level orchestration for testing operations
 */

const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const { loadConfig } = require('../../../config');
const { displayFormatting, testExecution } = require('../operations');

/**
 * Process parameters for specific actions to provide better UX
 * @param {string} actionName - The action being called
 * @param {Object} params - Raw parameters object
 * @returns {Object} Processed parameters
 */
function processActionParameters(actionName, params) {
  const processedParams = { ...params };

  // For delete-file action, automatically prepend storage directory to fileName if not already present
  if (actionName === 'delete-file' && processedParams.fileName) {
    try {
      const config = loadConfig(processedParams);
      const storageDirectory = config.storage.directory;
      if (!processedParams.fileName.startsWith(storageDirectory)) {
        processedParams.fileName = `${storageDirectory}${processedParams.fileName}`;
      }
    } catch (error) {
      // Fallback to default if config loading fails
      if (!processedParams.fileName.startsWith('public/')) {
        processedParams.fileName = `public/${processedParams.fileName}`;
      }
    }
  }

  // For get-products action, load Commerce URL from config and credentials from .env if not provided
  if (actionName === 'get-products') {
    // Load Commerce URL from environment configuration if not provided
    if (!processedParams.COMMERCE_BASE_URL) {
      try {
        const config = loadConfig();
        const commerceUrl = config.commerce.baseUrl;
        if (commerceUrl) {
          processedParams.COMMERCE_BASE_URL = commerceUrl;
        }
      } catch (error) {
        // Silently fail - user can provide URL manually
      }
    }

    // Load OAuth credentials from .env if not provided
    if (!processedParams.COMMERCE_CONSUMER_KEY || !processedParams.COMMERCE_ACCESS_TOKEN) {
      try {
        const envPath = path.join(__dirname, '../../../.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const envLines = envContent.split('\n');

          envLines.forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();

            if (key && value && !processedParams[key]) {
              processedParams[key] = value;
            }
          });
        }
      } catch (error) {
        // Silently fail - user can provide params manually
      }
    }
  }

  return processedParams;
}

/**
 * Display rich action test results with detailed information
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
  displayFormatting.displayActionStatus(status, statusText);
  displayFormatting.displayEnvironmentInfo(actionUrl, environment);

  // Display response details if successful
  if (status === 200 && body) {
    displayFormatting.displayExecutionSteps(body.steps);
    displayFormatting.displayStorageInfo(body);
    displayFormatting.displayDownloadInfo(body.downloadUrl);
    displayFormatting.displayPerformanceMetrics(body.performance);
    displayFormatting.displayMessage(body.message);
  } else if (body && body.error) {
    displayFormatting.displayErrorDetails(body.error);
  }

  // Add spacing after results
  console.log('');
}

/**
 * Action testing workflow
 * @param {string} actionName - Name of action to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @returns {Promise<Object>} Test result
 */
async function actionTestingWorkflow(actionName, options = {}) {
  const { params = {}, rawOutput = false } = options;

  try {
    // Process parameters for the specific action
    const processedParams = processActionParameters(actionName, params);

    // Handle environment detection
    testExecution.handleEnvironmentDetection(processedParams, rawOutput);

    if (rawOutput) {
      // Raw mode: just return response data
      return await testExecution.executeRawTest(actionName, processedParams);
    } else {
      // Enhanced mode: user-friendly output with rich display
      return await testExecution.executeEnhancedTest(
        actionName,
        processedParams,
        displayActionResults
      );
    }
  } catch (error) {
    throw new Error(`Action test failed: ${error.message}`);
  }
}

/**
 * Get available actions from app.config.yaml
 * @returns {Array} List of available action names
 */
function getAvailableActions() {
  try {
    const config = yaml.load(
      fs.readFileSync(path.join(__dirname, '../../../app.config.yaml'), 'utf8')
    );
    return Object.keys(
      config.application.runtimeManifest.packages['kukla-integration-service'].actions
    );
  } catch (error) {
    return [];
  }
}

module.exports = {
  actionTestingWorkflow,
  processActionParameters,
  getAvailableActions,
};
