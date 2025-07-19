/**
 * API Testing - Response Validation Sub-module
 * All API response validation utilities including structure, timing, and endpoint-specific validation
 */

// Response Validation Workflows

/**
 * Validate API test response comprehensively
 * @purpose Perform complete validation of API response including structure, timing, and endpoint-specific checks
 * @param {Object} testResult - API test result with response data
 * @param {string} endpoint - API endpoint name for endpoint-specific validation
 * @returns {Object} Comprehensive validation result with errors and warnings
 * @usedBy executeApiTestWorkflow
 */
function validateApiTestResponse(testResult, endpoint) {
  const errors = [];
  const warnings = [];

  try {
    // Step 1: Validate basic response structure
    validateBasicResponseStructure(testResult, errors);

    // Step 2: Validate response timing
    validateResponseTiming(testResult, warnings);

    // Step 3: Validate endpoint-specific data requirements
    if (testResult.success && testResult.data) {
      validateEndpointSpecificData(testResult, endpoint, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validationCount: errors.length + warnings.length,
    };
  } catch (validationError) {
    return buildFailureValidationResult(validationError);
  }
}

// Basic Response Structure Validation

/**
 * Validate basic response structure requirements
 * @purpose Check that response has required fields and proper structure
 * @param {Object} testResult - API test result to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validateApiTestResponse
 */
function validateBasicResponseStructure(testResult, errors) {
  if (!testResult) {
    errors.push('Test result is null or undefined');
    return;
  }

  if (typeof testResult.success !== 'boolean') {
    errors.push('Test result missing success field');
  }

  if (typeof testResult.duration !== 'number' || testResult.duration < 0) {
    errors.push('Test result missing or invalid duration');
  }

  if (testResult.success) {
    if (!testResult.statusCode || testResult.statusCode < 200 || testResult.statusCode >= 300) {
      errors.push(`Invalid success status code: ${testResult.statusCode}`);
    }

    if (!testResult.data) {
      errors.push('Successful response missing data field');
    }
  }
}

// Response Timing Validation

/**
 * Validate response timing performance
 * @purpose Check if response times are within acceptable ranges
 * @param {Object} testResult - API test result with timing data
 * @param {Array} warnings - Array to collect timing warnings
 * @usedBy validateApiTestResponse
 */
function validateResponseTiming(testResult, warnings) {
  const { duration } = testResult;

  if (duration > 5000) {
    warnings.push(`Slow response time: ${duration}ms (expected < 5000ms)`);
  } else if (duration > 2000) {
    warnings.push(`Response time above optimal: ${duration}ms (optimal < 2000ms)`);
  }

  if (duration < 10) {
    warnings.push(`Unusually fast response: ${duration}ms (possible mock/cache)`);
  }
}

// Endpoint-Specific Validation

/**
 * Validate endpoint-specific data requirements
 * @purpose Perform validation specific to the API endpoint being tested
 * @param {Object} testResult - API test result with response data
 * @param {string} endpoint - API endpoint name
 * @param {Array} warnings - Array to collect endpoint-specific warnings
 * @usedBy validateApiTestResponse
 */
function validateEndpointSpecificData(testResult, endpoint, warnings) {
  const { data } = testResult;

  switch (endpoint) {
    case 'products':
      validateProductsEndpointData(data, warnings);
      break;
    case 'categories':
      validateCategoriesEndpointData(data, warnings);
      break;
    case 'customers':
      validateCustomersEndpointData(data, warnings);
      break;
    case 'orders':
      validateOrdersEndpointData(data, warnings);
      break;
    default:
      // Generic validation for unknown endpoints
      if (!data || typeof data !== 'object') {
        warnings.push(`Endpoint ${endpoint}: Response data is not an object`);
      }
  }
}

/**
 * Validate products endpoint response data
 * @purpose Check products-specific response structure and data quality
 * @param {Object} data - Products response data
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateEndpointSpecificData
 */
function validateProductsEndpointData(data, warnings) {
  if (!data.items || !Array.isArray(data.items)) {
    warnings.push('Products response missing items array');
    return;
  }

  if (data.items.length === 0) {
    warnings.push('Products response contains no items');
    return;
  }

  const sampleProduct = data.items[0];
  if (!sampleProduct.sku) {
    warnings.push('Product items missing SKU field');
  }

  if (!sampleProduct.name) {
    warnings.push('Product items missing name field');
  }
}

/**
 * Validate categories endpoint response data
 * @purpose Check categories-specific response structure and data quality
 * @param {Object} data - Categories response data
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateEndpointSpecificData
 */
function validateCategoriesEndpointData(data, warnings) {
  if (!data.id) {
    warnings.push('Category response missing id field');
  }

  if (!data.name) {
    warnings.push('Category response missing name field');
  }
}

/**
 * Validate customers endpoint response data
 * @purpose Check customers-specific response structure and data quality
 * @param {Object} data - Customers response data
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateEndpointSpecificData
 */
function validateCustomersEndpointData(data, warnings) {
  if (!data.items || !Array.isArray(data.items)) {
    warnings.push('Customers response missing items array');
  }

  if (typeof data.total_count !== 'number') {
    warnings.push('Customers response missing total_count field');
  }
}

/**
 * Validate orders endpoint response data
 * @purpose Check orders-specific response structure and data quality
 * @param {Object} data - Orders response data
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateEndpointSpecificData
 */
function validateOrdersEndpointData(data, warnings) {
  if (!data.items || !Array.isArray(data.items)) {
    warnings.push('Orders response missing items array');
  }

  if (typeof data.total_count !== 'number') {
    warnings.push('Orders response missing total_count field');
  }
}

// Validation Result Building

/**
 * Build failure validation result for validation errors
 * @purpose Create standardized validation result when validation itself fails
 * @param {Error} error - Validation error that occurred
 * @returns {Object} Failure validation result
 * @usedBy validateApiTestResponse
 */
function buildFailureValidationResult(error) {
  return {
    isValid: false,
    errors: [`Validation failed: ${error.message}`],
    warnings: [],
    validationCount: 1,
  };
}

module.exports = {
  // Response Validation Workflows
  validateApiTestResponse,

  // Basic Structure Validation
  validateBasicResponseStructure,

  // Timing Validation
  validateResponseTiming,

  // Endpoint-Specific Validation
  validateEndpointSpecificData,
  validateProductsEndpointData,
  validateCategoriesEndpointData,
  validateCustomersEndpointData,
  validateOrdersEndpointData,

  // Validation Result Building
  buildFailureValidationResult,
};
