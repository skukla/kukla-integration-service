/**
 * Test Domain - Action Testing Workflow
 * Simplified orchestrator following Light DDD principles
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { isSuccessfulResponse } = require('../operations/response-handling');
const { executeActionTest, executeRawTest } = require('../operations/test-execution');

/**
 * Action testing workflow - Simplified orchestrator
 * @param {string} actionName - Name of action to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @param {boolean} options.isProd - Whether testing in production environment
 * @returns {Promise<Object>} Test result
 */
async function actionTestingWorkflow(actionName, options = {}) {
  const { params = {}, rawOutput = false, isProd = false } = options;

  try {
    if (rawOutput) {
      return await executeRawTest(actionName, params, isProd);
    }

    // Step 1: Environment setup and display
    const environment = getEnvironmentString(isProd);
    console.log(format.success(`Environment detected: ${format.environment(environment)}`));
    console.log(format.success(`Action tested: ${actionName}`));

    // Step 2: Execute action test
    const response = await executeActionTest(actionName, params, isProd);

    // Step 3: Display URL
    console.log(format.url(response.actionUrl));

    // Step 4: Display storage information if available
    if (response.body && response.body.storage) {
      const storageInfo = formatStorageInfo(response.body.storage);
      console.log(format.storage(storageInfo));
    }

    console.log(); // Add blank line before status

    // Step 5: Use domain-specific success logic
    const isSuccess = isSuccessfulResponse(response);
    console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));

    // Step 6: Display response data in master branch format
    if (isSuccess && response.body) {
      if (response.body.message) {
        console.log(format.section(`Message: ${response.body.message}`));
      }

      if (response.body.downloadUrl) {
        console.log();
        console.log(format.section('🔗 Download URL:'));
        console.log(`   ${response.body.downloadUrl}`);
      }

      if (response.body.steps && Array.isArray(response.body.steps)) {
        console.log();
        console.log(format.section('Steps:'));
        response.body.steps.forEach((step, index) => {
          console.log(`${index + 1}. ${step}`);
        });
      }
    } else if (!isSuccess && response.body && response.body.error) {
      console.log(format.section(`Error: ${response.body.error}`));
    }

    return {
      success: isSuccess,
      environment,
      actionName,
      status: response.status,
      message: isSuccess ? null : response.body?.error || 'Test failed',
    };
  } catch (error) {
    console.log(format.error(`Action test failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      actionName,
    };
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

module.exports = {
  actionTestingWorkflow,
};
