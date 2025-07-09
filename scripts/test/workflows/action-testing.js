/**
 * Action Testing Workflow
 * Extracted from scripts/test-action.js for domain organization
 * Handles testing of individual Adobe I/O Runtime actions
 */

const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');
const fetch = require('node-fetch');

const { loadConfig } = require('../../../config');
const { buildRuntimeUrl } = require('../../../src/core/routing');
const core = require('../../core');

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
 * Test an action by calling its runtime URL
 * @param {string} actionUrl - Full action URL
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Test result
 */
async function testAction(actionUrl, params) {
  const response = await fetch(actionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const responseBody = await response.json();

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
  };
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

    // Use shared environment detection if not explicitly set
    if (!processedParams.NODE_ENV && !process.env.NODE_ENV) {
      if (!rawOutput) {
        const envSpinner = core.createSpinner('Detecting workspace environment...');
        try {
          processedParams.NODE_ENV = core.detectScriptEnvironment(processedParams, {
            allowCliDetection: true,
          });
          const capitalizedEnv = core.capitalize(processedParams.NODE_ENV);
          envSpinner.succeed(`Environment detected: ${capitalizedEnv}`);
        } catch (error) {
          envSpinner.fail('Environment detection failed, defaulting to production');
          processedParams.NODE_ENV = 'production';
        }
      } else {
        processedParams.NODE_ENV = core.detectScriptEnvironment(processedParams, {
          allowCliDetection: true,
        });
      }
    }

    if (rawOutput) {
      // Raw mode: just return response data
      const config = loadConfig(processedParams);
      const actionUrl = buildRuntimeUrl(actionName, null, config);
      const response = await testAction(actionUrl, processedParams);

      return {
        success: true,
        rawResponse: response,
        actionUrl,
      };
    } else {
      // Enhanced mode: user-friendly output with spinners
      const testSpinner = core.createSpinner(`Testing action: ${actionName}`);

      const config = loadConfig(processedParams);
      const actionUrl = buildRuntimeUrl(actionName, null, config);
      const response = await testAction(actionUrl, processedParams);

      testSpinner.succeed(`Action tested: ${actionName}`);

      return {
        success: true,
        actionName,
        actionUrl,
        response,
        environment: processedParams.NODE_ENV,
        status: response.status,
        statusText: response.statusText,
      };
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
