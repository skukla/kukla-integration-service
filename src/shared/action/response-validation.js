/**
 * Response Validation Utilities
 * Static validation to catch common response formatting errors
 */

/**
 * Validate error response parameter
 * @purpose Catch common errors where strings are passed instead of error objects
 * @param {*} error - Error parameter to validate
 * @returns {Object} Validation result with fixed error if needed
 * @usedBy Action error handling, development validation
 */
function validateErrorParameter(error) {
  // If it's already a proper error object, return as-is
  if (error && typeof error === 'object' && 'message' in error) {
    return { isValid: true, error };
  }

  // If it's a string, wrap it in an error object
  if (typeof error === 'string') {
    return {
      isValid: false,
      error: { message: error },
      warning: 'String passed to response.error() - should be error object',
    };
  }

  // If it's an Error instance, extract message
  if (error instanceof Error) {
    return { isValid: true, error: { message: error.message, stack: error.stack } };
  }

  // Fallback for other types
  return {
    isValid: false,
    error: { message: 'Unknown error occurred' },
    warning: `Invalid error type: ${typeof error}`,
  };
}

/**
 * Validate response format before sending
 * @purpose Catch malformed responses before they reach the runtime
 * @param {Object} response - Response object to validate
 * @returns {Object} Validation result
 * @usedBy Action factory, response utilities
 */
function validateResponseFormat(response) {
  const errors = [];

  // Check required fields
  if (!response.statusCode) {
    errors.push('Missing statusCode');
  }

  if (!response.body) {
    errors.push('Missing body');
  }

  // Validate body is JSON string for API responses
  if (response.body && typeof response.body !== 'string') {
    errors.push('Body should be JSON string, not object');
  }

  // Try to parse body as JSON
  if (response.body) {
    try {
      const parsed = JSON.parse(response.body);
      if (parsed.success === undefined) {
        errors.push('Response body missing success field');
      }
    } catch (e) {
      errors.push('Response body is not valid JSON');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateErrorParameter,
  validateResponseFormat,
};
