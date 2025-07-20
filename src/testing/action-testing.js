/**
 * Action Testing
 * Complete action testing capability with execution, validation, and response verification
 */

const { buildTestingRuntimeConfig } = require('../../config/domains/runtime');
const { request } = require('../shared/http/client');
const { isSuccessStatus } = require('../shared/http/status-codes');
const { createUrlBuilders } = require('../shared/routing/url-factory');

// Business Workflows

/**
 * Execute complete action testing workflow
 * @purpose Test individual action functionality with comprehensive validation and response verification
 * @param {string} actionName - Name of action to test (get-products, browse-files, etc.)
 * @param {Object} options - Test options including environment and parameters
 * @returns {Promise<Object>} Complete action test result with validation and metrics
 * @usedBy scripts/test.js, test orchestration workflows
 * @config testing.endpoints, testing.expectations
 */
async function executeActionTestWorkflow(actionName, options = {}) {
  try {
    // Step 1: Validate and prepare test environment
    const validationResult = validateActionTestInputs(actionName, options);
    if (!validationResult.isValid) {
      return buildActionTestErrorResult(validationResult.error, actionName);
    }

    // Step 2: Build runtime config for testing
    const config = {
      runtime: buildTestingRuntimeConfig(),
    };
    const { runtimeUrl } = createUrlBuilders(config);
    const actionUrl = runtimeUrl(actionName);

    // Step 3: Execute action test with timing
    const testResult = await executeActionTestRequest(actionUrl, actionName, options);

    // Step 4: Validate response and build complete result
    const responseValidation = validateActionTestResponse(testResult, actionName);

    return buildActionTestResult(actionName, actionUrl, testResult, responseValidation, options);
  } catch (error) {
    return buildActionTestErrorResult(error, actionName);
  }
}

/**
 * Execute action test for specific target environment
 * @purpose Test action in specific environment with target-specific validation
 * @param {string} actionName - Name of action to test
 * @param {Object} targetOptions - Target-specific test options
 * @returns {Promise<Object>} Target-specific action test result
 * @usedBy test workflows that need environment-specific testing
 */
async function executeActionTestForTarget(actionName, targetOptions = {}) {
  const options = {
    ...targetOptions,
    useCase: targetOptions.useCase || 'default',
    isProd: targetOptions.environment === 'production',
    timeout: targetOptions.timeout || 10000,
  };

  return await executeActionTestWorkflow(actionName, options);
}

// Feature Operations

/**
 * Validate action test inputs and environment
 * @purpose Ensure action exists and test options are valid before execution
 * @param {string} actionName - Action name to validate
 * @param {Object} options - Test options to validate
 * @returns {Object} Validation result with isValid flag and error details
 */
function validateActionTestInputs(actionName, options) {
  const validActions = [
    'get-products',
    'get-products-mesh',
    'browse-files',
    'download-file',
    'delete-file',
  ];

  if (!actionName || typeof actionName !== 'string') {
    return { isValid: false, error: 'Action name is required and must be a string' };
  }

  if (!validActions.includes(actionName)) {
    return {
      isValid: false,
      error: `Unknown action: ${actionName}. Valid actions: ${validActions.join(', ')}`,
    };
  }

  if (options.timeout && (typeof options.timeout !== 'number' || options.timeout < 1000)) {
    return { isValid: false, error: 'Timeout must be a number >= 1000ms' };
  }

  return { isValid: true };
}

/**
 * Execute action HTTP request with timing and error handling
 * @purpose Make HTTP request to action with comprehensive error handling and timing
 * @param {string} actionUrl - Complete action URL
 * @param {string} actionName - Action name for context
 * @param {Object} options - Request options including timeout and parameters
 * @returns {Promise<Object>} Request result with response data and timing
 */
async function executeActionTestRequest(actionUrl, actionName, options) {
  const startTime = Date.now();
  const params = options.params || {};

  try {
    const response = await request(actionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const responseTime = Date.now() - startTime;

    // Parse response body regardless of status code
    let parsedData = null;
    try {
      parsedData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    } catch (parseError) {
      // If JSON parsing fails, keep the raw body
      parsedData = { rawBody: response.body };
    }

    return {
      success: isSuccessStatus(response.statusCode),
      statusCode: response.statusCode,
      responseTime,
      data: parsedData,
      headers: response.headers,
      url: actionUrl,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Check if error has response body (HTTP error from our createHttpError)
    if (error.body) {
      return {
        success: false,
        statusCode: error.status || 500,
        responseTime,
        data: error.body, // This contains the parsed JSON response
        headers: error.headers || {},
        url: actionUrl,
      };
    }

    // Network or other error without response body
    return {
      success: false,
      statusCode: error.status || 500,
      responseTime,
      error: error.message,
      url: actionUrl,
    };
  }
}

/**
 * Validate action response structure and content
 * @purpose Verify action response meets expected format and contains required data
 * @param {Object} testResult - Action test result from request execution
 * @param {string} actionName - Action name for validation context
 * @returns {Object} Validation result with detailed feedback
 */
function validateActionTestResponse(testResult, actionName) {
  if (!testResult.success) {
    // Extract detailed error from response data if available
    const detailedError = testResult.data?.error || testResult.error || 'Unknown error';
    return {
      isValid: false,
      errors: [`Action request failed: ${detailedError}`],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];

  // Validate response structure
  if (!testResult.data) {
    errors.push('Response missing data field');
  }

  if (testResult.statusCode !== 200) {
    errors.push(`Expected status code 200, got ${testResult.statusCode}`);
  }

  // Validate response timing
  if (testResult.responseTime > 5000) {
    warnings.push(`Response time ${testResult.responseTime}ms exceeds 5s threshold`);
  }

  // Action-specific validation
  validateActionSpecificResponse(actionName, testResult, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate action-specific response requirements
 * @purpose Check action-specific response structure and content
 * @param {string} actionName - Action name for specific validation
 * @param {Object} testResult - Test result with response data
 * @param {Array} warnings - Array to collect warnings
 * @usedBy validateActionTestResponse
 */
function validateActionSpecificResponse(actionName, testResult, warnings) {
  if (actionName.includes('products') && testResult.data) {
    if (!testResult.data.products && !testResult.data.downloadUrl) {
      warnings.push('Products action should return products data or download URL');
    }
  }
}

// Feature Utilities

/**
 * Generate mock action response for testing
 * @purpose Create realistic mock responses based on action type
 * @param {string} actionName - Action name to generate response for
 * @param {Object} params - Request parameters for response customization
 * @returns {Object} Mock action response data
 */
function generateMockActionResponse(actionName, params) {
  switch (actionName) {
    case 'get-products':
    case 'get-products-mesh':
      return {
        success: true,
        message: 'Product export completed successfully',
        downloadUrl: 'https://example.com/downloads/products.csv',
        productCount: 119,
        storage: 'app-builder',
      };

    case 'browse-files':
      return {
        success: true,
        message: 'Files retrieved successfully',
        files: [
          { name: 'products.csv', size: '15KB', modified: '2024-07-18' },
          { name: 'exports.csv', size: '23KB', modified: '2024-07-17' },
        ],
      };

    case 'download-file':
      return {
        success: true,
        message: 'File download URL generated',
        downloadUrl: 'https://example.com/downloads/file.csv',
      };

    case 'delete-file':
      return {
        success: true,
        message: 'File deleted successfully',
        fileName: params.fileName || 'example.csv',
      };

    default:
      return {
        success: true,
        message: 'Action executed successfully',
        actionName,
      };
  }
}

/**
 * Build comprehensive action test result
 * @purpose Create standardized action test result with all relevant information
 * @param {string} actionName - Action name that was tested
 * @param {string} actionUrl - URL that was tested
 * @param {Object} testResult - Raw test execution result
 * @param {Object} validation - Response validation result
 * @param {Object} options - Original test options
 * @returns {Object} Complete action test result
 */
function buildActionTestResult(actionName, actionUrl, testResult, validation, options) {
  return {
    success: validation.isValid,
    actionName,
    url: actionUrl,
    response: testResult,
    validation,
    duration: testResult.responseTime,
    executedAt: new Date().toISOString(),
    environment: options.isProd ? 'production' : 'staging',
    details: validation.isValid
      ? [`Action responded in ${testResult.responseTime}ms`]
      : validation.errors,
  };
}

/**
 * Build action test error result
 * @purpose Create standardized error result for failed action tests
 * @param {Error|string} error - Error that occurred during testing
 * @param {string} actionName - Action name that was being tested
 * @returns {Object} Standardized error result
 */
function buildActionTestErrorResult(error, actionName) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return {
    success: false,
    actionName,
    error: errorMessage,
    details: [errorMessage],
    executedAt: new Date().toISOString(),
  };
}

module.exports = {
  // Business workflows
  executeActionTestWorkflow,
  executeActionTestForTarget,

  // Feature operations
  validateActionTestInputs,
  executeActionTestRequest,
  validateActionTestResponse,

  // Feature utilities
  validateActionSpecificResponse,
  generateMockActionResponse,
  buildActionTestResult,
  buildActionTestErrorResult,
};
