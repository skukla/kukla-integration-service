/**
 * Commerce Authentication Operations
 *
 * Mid-level business processes for Commerce API authentication.
 * Coordinates OAuth 1.0 authentication for Commerce API requests.
 */

const { validateOAuthCredentials: validateOAuthCredentialsBasic } = require('../utils/oauth');
const { createAuthenticatedHeaders } = require('../utils/request-factories');

/**
 * Authenticates a Commerce API request with OAuth 1.0
 * @param {Object} params - Action parameters containing OAuth credentials
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} [additionalHeaders] - Additional headers to include
 * @returns {Object} Authentication headers
 */
function authenticateRequest(params, method, url, additionalHeaders = {}) {
  // Validate required OAuth credentials using basic validation
  if (!validateOAuthCredentialsBasic(params)) {
    const requiredCredentials = [
      'COMMERCE_CONSUMER_KEY',
      'COMMERCE_CONSUMER_SECRET',
      'COMMERCE_ACCESS_TOKEN',
      'COMMERCE_ACCESS_TOKEN_SECRET',
    ];

    const missingCredentials = requiredCredentials.filter((credential) => !params[credential]);
    throw new Error(`Missing OAuth credentials: ${missingCredentials.join(', ')}`);
  }

  // Create authenticated headers
  return createAuthenticatedHeaders(params, method, url, additionalHeaders);
}

/**
 * Validates OAuth credentials format
 * @param {Object} params - Action parameters
 * @returns {Object} Validation result
 */
function validateOAuthCredentials(params) {
  const errors = [];

  if (!params.COMMERCE_CONSUMER_KEY || typeof params.COMMERCE_CONSUMER_KEY !== 'string') {
    errors.push('COMMERCE_CONSUMER_KEY must be a non-empty string');
  }

  if (!params.COMMERCE_CONSUMER_SECRET || typeof params.COMMERCE_CONSUMER_SECRET !== 'string') {
    errors.push('COMMERCE_CONSUMER_SECRET must be a non-empty string');
  }

  if (!params.COMMERCE_ACCESS_TOKEN || typeof params.COMMERCE_ACCESS_TOKEN !== 'string') {
    errors.push('COMMERCE_ACCESS_TOKEN must be a non-empty string');
  }

  if (
    !params.COMMERCE_ACCESS_TOKEN_SECRET ||
    typeof params.COMMERCE_ACCESS_TOKEN_SECRET !== 'string'
  ) {
    errors.push('COMMERCE_ACCESS_TOKEN_SECRET must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an OAuth authentication context
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Authentication context
 */
function createAuthenticationContext(params, config) {
  const validation = validateOAuthCredentials(params);

  if (!validation.isValid) {
    throw new Error(`Invalid OAuth credentials: ${validation.errors.join(', ')}`);
  }

  return {
    credentials: {
      consumerKey: params.COMMERCE_CONSUMER_KEY,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET,
      accessToken: params.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
    },
    baseUrl: config.commerce.baseUrl,
    version: config.commerce.version,
    authenticate: (method, url, additionalHeaders) =>
      authenticateRequest(params, method, url, additionalHeaders),
  };
}

/**
 * Handles OAuth authentication errors
 * @param {Error} error - Authentication error
 * @returns {Object} Enhanced error information
 */
function handleAuthenticationError(error) {
  const authErrorPatterns = [
    { pattern: /unauthorized/i, message: 'Invalid OAuth credentials' },
    { pattern: /consumer_key/i, message: 'Invalid consumer key' },
    { pattern: /signature/i, message: 'OAuth signature verification failed' },
    { pattern: /timestamp/i, message: 'OAuth timestamp validation failed' },
    { pattern: /nonce/i, message: 'OAuth nonce validation failed' },
  ];

  for (const { pattern, message } of authErrorPatterns) {
    if (pattern.test(error.message)) {
      return {
        isAuthenticationError: true,
        originalError: error,
        enhancedMessage: message,
        suggestion: 'Please verify your OAuth credentials in the .env file',
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
  authenticateRequest,
  validateOAuthCredentials,
  createAuthenticationContext,
  handleAuthenticationError,
  retryWithAuthHandling,
};
