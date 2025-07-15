/**
 * API Testing Workflow
 * Tests API endpoints
 * Following Light DDD principles and scripts standards
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { formatStorageInfo } = require('../../core/utils/response');
const { buildActionUrl } = require('../operations/url-building');

/**
 * API testing workflow
 * @param {string} endpoint - API endpoint to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - API parameters
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {boolean} options.isProd - Whether testing in production
 * @returns {Promise<Object>} Test result
 */
async function apiTestingWorkflow(endpoint, options = {}) {
  const { params = {}, method = 'GET', isProd = false } = options;
  const environment = getEnvironmentString(isProd);

  try {
    // Step 1: Display environment and endpoint info (aligned with action testing)
    console.log(format.success(`Environment detected: ${format.environment(environment)}`));
    console.log(format.success(`API endpoint tested: ${endpoint}`));
    console.log();

    // Step 2: Build and display API URL
    const apiUrl = buildActionUrl(endpoint, params, isProd);
    console.log(format.url(apiUrl));

    // Step 3: Execute API call
    const fetch = require('node-fetch');
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(method !== 'GET' && { body: JSON.stringify(params) }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const responseBody = await response.json();

    // Step 4: Display storage info if available (aligned with action testing)
    if (responseBody && responseBody.storage) {
      const storageInfo = formatStorageInfo(responseBody.storage);
      console.log(format.storage(storageInfo));
    }
    console.log();

    // Step 5: Display status with response time (unique to API testing)
    const isSuccess = response.status >= 200 && response.status < 300;
    console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));
    console.log(format.section(`Response Time: ${duration}ms`));

    // Step 6: Display message if available (aligned with action testing)
    if (responseBody && responseBody.message) {
      console.log(`${format.messageLabel('Message:')} ${responseBody.message}`);
    }

    console.log();
    console.log(format.section('Response Data:'));
    console.log(JSON.stringify(responseBody, null, 2));

    return {
      success: isSuccess,
      endpoint,
      environment,
      status: response.status,
      duration,
      response: responseBody,
    };
  } catch (error) {
    console.log(format.error(`API test failed: ${error.message}`));
    return {
      success: false,
      endpoint,
      environment,
      error: error.message,
    };
  }
}

module.exports = {
  apiTestingWorkflow,
};
