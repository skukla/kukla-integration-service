/**
 * API Testing Workflow
 * Tests API endpoints with beautiful formatted output
 * Following Light DDD principles and scripts standards
 */

const format = require('../../core/formatting');
const { buildActionUrl } = require('../operations/url-building');

/**
 * API testing workflow with beautiful formatting
 * @param {string} endpoint - API endpoint to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - API parameters
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {boolean} options.isProd - Whether testing in production
 * @returns {Promise<Object>} Test result
 */
async function apiTestingWorkflow(endpoint, options = {}) {
  const { params = {}, method = 'GET', isProd = false } = options;
  const environment = isProd ? 'production' : 'staging';

  try {
    console.log(format.info(`🔗 Testing API endpoint: ${endpoint}`));
    console.log(format.section(`Environment: ${format.environment(environment)}`));
    console.log();

    // Step 1: Build API URL
    const apiUrl = buildActionUrl(endpoint, params, isProd);
    console.log(format.url(apiUrl));
    console.log();

    // Step 2: Execute API call
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

    // Step 3: Display results with beautiful formatting
    const isSuccess = response.status >= 200 && response.status < 300;
    console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));
    console.log(format.section(`Response Time: ${duration}ms`));
    console.log();

    if (isSuccess) {
      console.log(format.success('✅ API test completed successfully'));
    } else {
      console.log(format.error(`❌ API test failed: ${response.statusText}`));
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
