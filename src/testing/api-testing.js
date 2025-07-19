/**
 * API Testing - Feature Core
 * Complete API endpoint testing capability with organized sub-modules for different utility categories
 */

const { loadConfig } = require('../../config');
const {
  buildApiTestUrl,
  buildApiRequestOptions,
  executeApiTestRequest,
} = require('./api-testing/endpoint-testing');
const { validateApiTestResponse } = require('./api-testing/response-validation');
const { buildApiTestResult, buildApiTestErrorResult } = require('./api-testing/result-building');

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
    const apiUrl = buildApiTestUrl(endpoint, config);
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

/**
 * Execute API test with specific parameters
 * @purpose Test API endpoint with custom parameters and validation rules
 * @param {string} endpoint - API endpoint to test
 * @param {Object} testParams - Specific test parameters
 * @param {Object} options - Additional test options
 * @returns {Promise<Object>} API test result with parameter-specific validation
 * @usedBy Test orchestration, custom testing scenarios
 */
async function executeApiTestWithParams(endpoint, testParams, options = {}) {
  const enhancedOptions = { ...options, params: testParams };
  return await executeApiTestWorkflow(endpoint, enhancedOptions);
}

// Feature Operations

/**
 * Validate API test inputs
 * @purpose Validate API test parameters and environment settings
 * @param {string} endpoint - API endpoint to test
 * @param {Object} options - API test options
 * @returns {Object} Validation result with errors and configuration
 * @usedBy executeApiTestWorkflow
 */
function validateApiTestInputs(endpoint, options) {
  const errors = [];
  const warnings = [];

  validateEndpointInput(endpoint, errors);
  validateApiTestOptions(options, errors, warnings);

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors,
    warnings,
  };
}

/**
 * Validate endpoint input parameter
 * @purpose Check endpoint name format and requirements
 * @param {string} endpoint - Endpoint to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validateApiTestInputs
 */
function validateEndpointInput(endpoint, errors) {
  if (!endpoint || typeof endpoint !== 'string') {
    errors.push('API endpoint is required and must be a string');
    return;
  }

  if (!isValidEndpointName(endpoint)) {
    errors.push(
      `Invalid endpoint name: ${endpoint}. Must contain only letters, numbers, and hyphens`
    );
  }
}

/**
 * Validate API test options
 * @purpose Check options object structure and values
 * @param {Object} options - Options to validate
 * @param {Array} errors - Array to collect validation errors
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateApiTestInputs
 */
function validateApiTestOptions(options, errors, warnings) {
  if (options && typeof options !== 'object') {
    errors.push('Options must be an object if provided');
    return;
  }

  if (options && options.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
    errors.push('Timeout must be a positive number if provided');
  }

  if (options && options.method && !isValidHttpMethod(options.method)) {
    warnings.push('Invalid HTTP method specified, using GET');
  }
}

// Feature Utilities

/**
 * Check if endpoint name is valid
 * @purpose Validate endpoint name format and characters
 * @param {string} endpoint - Endpoint name to validate
 * @returns {boolean} True if endpoint name is valid
 * @usedBy validateEndpointInput
 */
function isValidEndpointName(endpoint) {
  // Allow letters, numbers, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(endpoint);
}

/**
 * Check if HTTP method is valid
 * @purpose Validate HTTP method against allowed methods
 * @param {string} method - HTTP method to validate
 * @returns {boolean} True if HTTP method is valid
 * @usedBy validateApiTestOptions
 */
function isValidHttpMethod(method) {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  return allowedMethods.includes(method.toUpperCase());
}

module.exports = {
  // Business workflows (main exports that actions import)
  executeApiTestWorkflow,
  executeApiTestWithParams,

  // Feature operations (coordination functions)
  validateApiTestInputs,
  validateEndpointInput,
  validateApiTestOptions,

  // Feature utilities (building blocks)
  isValidEndpointName,
  isValidHttpMethod,
};
