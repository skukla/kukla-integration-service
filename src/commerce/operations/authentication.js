/**
 * Commerce Authentication Operations
 *
 * Mid-level business processes for Commerce API authentication.
 * Coordinates admin token authentication for Commerce API requests.
 */

/**
 * Handles authentication errors
 * @param {Error} error - Authentication error
 * @returns {Object} Enhanced error information
 */
function handleAuthenticationError(error) {
  const authErrorPatterns = [
    { pattern: /unauthorized/i, message: 'Invalid admin credentials' },
    { pattern: /consumer_key/i, message: 'Invalid consumer key' },
    { pattern: /signature/i, message: 'Authentication signature verification failed' },
    { pattern: /timestamp/i, message: 'Authentication timestamp validation failed' },
    { pattern: /nonce/i, message: 'Authentication nonce validation failed' },
  ];

  for (const { pattern, message } of authErrorPatterns) {
    if (pattern.test(error.message)) {
      return {
        isAuthenticationError: true,
        originalError: error,
        enhancedMessage: message,
        suggestion: 'Please verify your admin credentials in the .env file',
      };
    }
  }

  return {
    isAuthenticationError: false,
    originalError: error,
    enhancedMessage: error.message,
  };
}

/**
 * Retries a request with authentication error handling
 * @param {Function} requestFn - Request function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=2] - Maximum retry attempts
 * @param {number} [options.retryDelay=1000] - Delay between retries
 * @returns {Promise} Request result
 */
async function retryWithAuthHandling(requestFn, options = {}) {
  const { maxRetries = 2, retryDelay = 1000 } = options;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      const authError = handleAuthenticationError(error);

      // Don't retry authentication errors
      if (authError.isAuthenticationError) {
        throw new Error(authError.enhancedMessage + '. ' + authError.suggestion);
      }

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}

module.exports = {
  handleAuthenticationError,
  retryWithAuthHandling,
};
