/**
 * API Testing
 * Complete API testing capability with request execution and response validation
 */

const { loadConfig } = require('../../config');
const { buildApiRequestOptions } = require('./api-testing/endpoint-testing');
const { executeApiTestRequest } = require('./api-testing/endpoint-testing');
const { validateApiTestResponse } = require('./api-testing/response-validation');
const { buildApiTestResult, buildApiTestErrorResult } = require('./api-testing/result-building');
const { createUrlBuilders } = require('../shared/routing/url-factory');

// Business Workflows

/**
 * Execute complete API testing workflow
 * @purpose Test API endpoints directly with comprehensive validation and response verification
 * @param {string} endpoint - API endpoint to test (products, categories, etc.)
 * @param {Object} options - Test options including parameters and environment settings
 * @returns {Promise<Object>} Complete API test result with validation and metrics
 * @usedBy scripts/test.js, test orchestration workflows
 * @config commerce.baseUrl, testing.endpoints, testing.expectations
 */
async function executeApiTestWorkflow(endpoint, options = {}) {
  try {
    // Step 1: Validate inputs and prepare test environment
    const validationResult = validateApiTestInputs(endpoint, options);
    if (!validationResult.isValid) {
      return buildApiTestErrorResult(validationResult.error, endpoint);
    }

    // Step 2: Build API URL and prepare request
    const config = loadConfig({}, options.isProd);
    const { commerceUrl } = createUrlBuilders(config);
    const apiUrl = commerceUrl(endpoint);
    const requestOptions = buildApiRequestOptions(options);

    // Step 3: Execute API test with comprehensive error handling
    const testResult = await executeApiTestRequest(apiUrl, endpoint, requestOptions);

    // Step 4: Validate response and build complete result
    const responseValidation = validateApiTestResponse(testResult, endpoint);

    return buildApiTestResult(endpoint, apiUrl, testResult, responseValidation, options);
  } catch (error) {
    return buildApiTestErrorResult(error, endpoint);
  }
}

// Feature Operations

/**
 * Validate API test inputs
 * @purpose Validate API test parameters and environment settings
 * @param {string} endpoint - API endpoint to test
 * @param {Object} options - API test options
 * @returns {Object} Validation result with errors and configuration
 */
function validateApiTestInputs(endpoint, options) {
  const errors = [];

  if (!endpoint || typeof endpoint !== 'string') {
    errors.push('API endpoint is required and must be a string');
  }

  if (!isValidEndpointName(endpoint)) {
    errors.push(`Invalid endpoint name: ${endpoint}`);
  }

  if (options && options.timeout && typeof options.timeout !== 'number') {
    errors.push('Timeout must be a number if provided');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
  };
}

/**
 * Check if endpoint name is valid
 * @purpose Validate endpoint name format and characters
 * @param {string} endpoint - Endpoint name to validate
 * @returns {boolean} True if endpoint name is valid
 */
function isValidEndpointName(endpoint) {
  return /^[a-zA-Z0-9_-]+$/.test(endpoint);
}

/**
 * Check if HTTP method is valid
 * @purpose Validate HTTP method against allowed methods
 * @param {string} method - HTTP method to validate
 * @returns {boolean} True if HTTP method is valid
 */
function isValidHttpMethod(method) {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  return allowedMethods.includes(method.toUpperCase());
}

module.exports = {
  executeApiTestWorkflow,
  validateApiTestInputs,
  isValidEndpointName,
  isValidHttpMethod,
};
