/**
 * Commerce Admin Token Authentication
 * Complete admin token authentication capability for Commerce API requests
 */

const { executeRequest } = require('../shared/http/client');
const { buildCommerceApiUrl } = require('../shared/routing/commerce');
const { sleep } = require('../shared/utils/async');
const { buildTokenCacheKey: buildCacheKey } = require('../shared/utils/cache');

// Business Workflows

/**
 * Execute authenticated Commerce request with automatic token management
 * @purpose Execute Commerce API request with automatic admin token authentication and retry logic
 * @param {string} endpoint - Commerce API endpoint path
 * @param {Object} requestOptions - HTTP request options (method, headers, body)
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Request parameters for URL building and authentication
 * @returns {Promise<Object>} Commerce API response data
 * @usedBy Products, commerce, and files domains for authenticated API access
 */
async function executeAuthenticatedCommerceRequest(endpoint, requestOptions, config, params) {
  const token = await getAdminToken(config, params);
  const options = buildAuthenticatedRequestOptions(requestOptions, token);
  const url = buildCommerceApiUrl(endpoint, config, params);

  return await executeRequestWithAuthRetry(url, options, config, params);
}

/**
 * Execute multiple authenticated Commerce requests in batch
 * @purpose Execute multiple Commerce API requests efficiently with shared token and parallel processing
 * @param {Array} requests - Array of request objects with endpoint and options
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Request parameters for URL building and authentication
 * @returns {Promise<Array>} Array of Commerce API response results
 * @usedBy Category and inventory enrichment for bulk data fetching
 */
async function executeBatchAuthenticatedRequests(requests, config, params) {
  const token = await getAdminToken(config, params);

  const authenticatedRequests = requests.map((request) => ({
    ...request,
    options: buildAuthenticatedRequestOptions(request.options, token),
    url: buildCommerceApiUrl(request.endpoint, config, params),
  }));

  return await Promise.allSettled(
    authenticatedRequests.map((req) =>
      executeRequestWithAuthRetry(req.url, req.options, config, params)
    )
  );
}

/**
 * Get admin token for external use
 * @purpose Provide admin token for external domain workflows requiring direct token access
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Request parameters for token generation
 * @returns {Promise<string>} Valid admin token for Commerce API authentication
 * @usedBy External domains requiring direct token access for specialized requests
 */
async function getAdminTokenOnly(config, params) {
  return await getAdminToken(config, params);
}

// Feature Operations

/**
 * Get or generate admin token with caching
 * @purpose Manage admin token lifecycle with caching, validation, and automatic refresh
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Request parameters for token generation and caching
 * @returns {Promise<string>} Valid admin token for Commerce API requests
 * @usedBy Authentication workflows requiring token management
 */
async function getAdminToken(config, params) {
  const cacheKey = buildTokenCacheKey(config, params);
  const cachedToken = buildCacheKey(cacheKey);

  if (cachedToken && !isTokenExpired(cachedToken)) {
    return cachedToken.token;
  }

  return await generateAdminToken(config, params);
}

/**
 * Generate new admin token from Commerce API
 * @purpose Generate fresh admin token using Commerce admin credentials with validation
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Request parameters for token generation
 * @returns {Promise<string>} Newly generated admin token for Commerce API
 * @usedBy Token management when cache is empty or expired
 */
async function generateAdminToken(config, params) {
  validateAdminCredentials(config);

  const tokenEndpoint = '/rest/V1/integration/admin/token';
  const tokenUrl = buildCommerceApiUrl(tokenEndpoint, config, params);

  const tokenOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.commerce.adminUsername,
      password: config.commerce.adminPassword,
    }),
  };

  const tokenResponse = await executeRequest(tokenUrl, tokenOptions);
  const token = tokenResponse.replace(/"/g, '');

  // Cache token with expiration
  const cacheKey = buildTokenCacheKey(config, params);
  buildCacheKey(cacheKey, {
    token,
    expiresAt: Date.now() + 3 * 60 * 60 * 1000, // 3 hours
  });

  return token;
}

/**
 * Execute request with authentication retry logic
 * @purpose Execute HTTP request with automatic retry on authentication failures
 * @param {string} url - Complete URL for the Commerce API request
 * @param {Object} options - HTTP request options with authentication headers
 * @param {Object} config - Application configuration for retry logic
 * @param {Object} params - Request parameters for token refresh
 * @returns {Promise<Object>} Commerce API response data
 * @usedBy Authenticated request execution with automatic recovery
 */
async function executeRequestWithAuthRetry(url, options, config, params) {
  try {
    return await executeRequest(url, options);
  } catch (error) {
    if (isAuthenticationError(error)) {
      // Clear cached token and retry with fresh token
      const cacheKey = buildTokenCacheKey(config, params);
      buildCacheKey(cacheKey, null);

      const newToken = await generateAdminToken(config, params);
      const retryOptions = buildAuthenticatedRequestOptions(options, newToken);

      await sleep(1000); // Brief delay before retry
      return await executeRequest(url, retryOptions);
    }
    throw error;
  }
}

// Feature Utilities

/**
 * Build authenticated request options with token
 * @purpose Add admin token authentication headers to HTTP request options
 * @param {Object} requestOptions - Base HTTP request options
 * @param {string} token - Valid admin token for authentication
 * @returns {Object} Request options with authentication headers
 * @usedBy Request building for authenticated Commerce API calls
 */
function buildAuthenticatedRequestOptions(requestOptions, token) {
  return {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Validate admin credentials configuration
 * @purpose Validate required admin credentials are present in configuration
 * @param {Object} config - Application configuration to validate
 * @throws {Error} When required admin credentials are missing
 * @usedBy Token generation to ensure valid credentials
 */
function validateAdminCredentials(config) {
  if (!config.commerce.adminUsername || !config.commerce.adminPassword) {
    throw new Error('Commerce admin credentials (username and password) are required');
  }
}

/**
 * Build token cache key for admin token storage
 * @purpose Generate unique cache key for admin token based on Commerce configuration
 * @param {Object} config - Application configuration with Commerce instance details
 * @returns {string} Unique cache key for token storage
 * @usedBy Token caching and retrieval operations
 */
function buildTokenCacheKey(config) {
  const baseUrl = config.commerce.baseUrl || 'default';
  const username = config.commerce.adminUsername || 'default';
  return `admin-token-${baseUrl}-${username}`;
}

/**
 * Check if admin token is expired
 * @purpose Validate admin token expiration to determine if refresh is needed
 * @param {Object} tokenData - Cached token data with expiration timestamp
 * @returns {boolean} True if token is expired and needs refresh
 * @usedBy Token validation before using cached tokens
 */
function isTokenExpired(tokenData) {
  if (!tokenData || !tokenData.expiresAt) {
    return true;
  }
  return Date.now() > tokenData.expiresAt;
}

/**
 * Check if error indicates authentication failure
 * @purpose Identify authentication errors that require token refresh
 * @param {Error} error - Error object from Commerce API request
 * @returns {boolean} True if error indicates authentication failure
 * @usedBy Retry logic to determine when to refresh tokens
 */
function isAuthenticationError(error) {
  if (!error) return false;

  const authErrorCodes = [401, 403];
  const authErrorMessages = ['unauthorized', 'forbidden', 'invalid token', 'token expired'];

  return (
    authErrorCodes.includes(error.status) ||
    authErrorMessages.some((msg) => error.message && error.message.toLowerCase().includes(msg))
  );
}

module.exports = {
  // Business workflows
  executeAuthenticatedCommerceRequest,
  executeBatchAuthenticatedRequests,
  getAdminTokenOnly,

  // Feature operations
  getAdminToken,
  generateAdminToken,
  executeRequestWithAuthRetry,

  // Feature utilities
  buildAuthenticatedRequestOptions,
  validateAdminCredentials,
  buildTokenCacheKey,
  isTokenExpired,
  isAuthenticationError,
};
