/**
 * Commerce Admin Token Authentication
 * Complete admin token authentication capability for Commerce API requests
 */

const { request } = require('../shared/http/client');
const { getAuthErrorCodes } = require('../shared/http/status-codes');
const { createUrlBuilders } = require('../shared/routing/url-factory');
const { sleep } = require('../shared/utils/async');
const { getCommerceParameters } = require('../shared/utils/parameters');

// Token storage - In-memory cache for admin tokens
const tokenStorage = new Map();

// Business Workflows

/**
 * Execute authenticated Commerce API request with automatic token management
 * @purpose Make authenticated Commerce API calls with automatic token acquisition and retry logic
 * @param {string} endpoint - Commerce API endpoint name (products, categories, etc.)
 * @param {Object} requestOptions - HTTP request options (method, headers, body, query)
 * @param {Object} config - Application configuration with commerce settings
 * @param {Object} params - URL path parameters for endpoint building
 * @returns {Promise<Object>} Commerce API response data
 * @usedBy All authenticated Commerce operations
 */
async function executeAuthenticatedCommerceRequest(endpoint, requestOptions, config, params) {
  const token = await getAdminToken(config, params);
  const options = buildAuthenticatedRequestOptions(requestOptions, token, config);
  const { commerceUrl } = createUrlBuilders(config);
  const url = commerceUrl(endpoint, {}, params);

  return await executeRequestWithAuthRetry(url, options, config);
}

/**
 * Execute multiple authenticated Commerce requests in batch
 * @purpose Execute multiple Commerce API requests efficiently with shared token and parallel processing
 * @param {Array<Object>} requests - Array of request objects with endpoint and options
 * @param {Object} config - Configuration object with commerce and authentication settings
 * @param {Object} params - Common parameters to apply to all requests
 * @returns {Promise<Array>} Array of request results from Promise.allSettled
 * @usedBy Batch commerce operations, bulk data fetching workflows
 */
async function executeBatchAuthenticatedRequests(requests, config, params) {
  const token = await getAdminToken(config, params);

  // Create URL builders once for all requests
  const { commerceUrl } = createUrlBuilders(config);
  const authenticatedRequests = requests.map((request) => ({
    ...request,
    options: buildAuthenticatedRequestOptions(request.options, token, config),
    url: commerceUrl(request.endpoint, {}, params),
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
 * Get or generate admin token with enhanced caching
 * @purpose Manage admin token lifecycle with improved caching, validation, and automatic refresh
 * @param {Object} config - Application configuration with Commerce credentials
 * @param {Object} params - Action parameters with potential credential overrides
 * @returns {Promise<string>} Valid admin token for Commerce API requests
 * @usedBy Authentication workflows requiring token management
 */
async function getAdminToken(config, params = {}) {
  const cacheKey = buildAdminTokenCacheKey(config, params);
  const cachedTokenData = tokenStorage.get(cacheKey);

  if (cachedTokenData && !isTokenExpired(cachedTokenData)) {
    return cachedTokenData.token;
  }

  // Generate new token and store it
  const newToken = await generateAdminToken(config, params);
  const tokenData = {
    token: newToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + getTokenExpirationTime(config),
  };

  tokenStorage.set(cacheKey, tokenData);
  return newToken;
}

/**
 * Generate new admin token for Commerce API authentication
 * @purpose Generate fresh admin token using Commerce API credentials when cache is empty or expired
 * @param {Object} config - Application configuration with commerce credentials
 * @param {Object} params - Action parameters with potential credential overrides
 * @returns {Promise<string>} Newly generated admin token for Commerce API
 * @usedBy Token management when cache is empty or expired
 */
async function generateAdminToken(config, params = {}) {
  // Use parameter resolver for consistent credential resolution
  const { adminUsername, adminPassword } = getCommerceParameters(params, config);

  const { commerceUrl } = createUrlBuilders(config);
  const tokenEndpoint = commerceUrl('adminToken');

  const tokenOptions = {
    method: 'POST',
    headers: config.commerce.defaultHeaders,
    body: JSON.stringify({
      username: adminUsername,
      password: adminPassword,
    }),
  };

  const response = await request(tokenEndpoint, tokenOptions);

  if (!response.body || typeof response.body !== 'string') {
    throw new Error('Invalid token response format');
  }

  // Commerce API returns token in quotes, so we need to clean it
  return response.body.replace(/"/g, '');
}

/**
 * Execute request with authentication retry logic
 * @purpose Execute HTTP request with automatic retry on authentication failures
 * @param {string} url - Complete URL for the Commerce API request
 * @param {Object} options - HTTP request options with authentication headers
 * @param {Object} config - Application configuration for retry logic
 * @returns {Promise<Object>} Commerce API response data with success property
 * @usedBy Authenticated request execution with automatic recovery
 */
async function executeRequestWithAuthRetry(url, options, config) {
  try {
    const response = await request(url, options);

    return {
      ...response,
      success: response.statusCode >= 200 && response.statusCode < 300,
    };
  } catch (error) {
    if (isAuthenticationError(error)) {
      // Clear cached token and retry with fresh token
      const cacheKey = buildAdminTokenCacheKey(config, {});
      tokenStorage.delete(cacheKey);

      const newToken = await generateAdminToken(config, {});
      const retryOptions = buildAuthenticatedRequestOptions(options, newToken, config);

      await sleep(1000); // Brief delay before retry
      const retryResponse = await request(url, retryOptions);

      // Add success property to retry response as well
      return {
        ...retryResponse,
        success: retryResponse.statusCode >= 200 && retryResponse.statusCode < 300,
      };
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
 * @param {Object} config - Configuration object with default headers
 * @returns {Object} Request options with authentication headers
 * @usedBy Request building for authenticated Commerce API calls
 */
function buildAuthenticatedRequestOptions(requestOptions, token, config) {
  return {
    ...requestOptions,
    headers: {
      ...config.commerce.defaultHeaders,
      ...requestOptions.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * Build admin token cache key for storage
 * @purpose Generate unique cache key for admin token based on Commerce configuration
 * @param {Object} config - Application configuration with Commerce instance details
 * @returns {string} Unique cache key for token storage
 * @usedBy Token caching and retrieval operations
 */
function buildAdminTokenCacheKey(config, params = {}) {
  const { baseUrl, adminUsername } = getCommerceParameters(params, config);
  return `admin-token-${Buffer.from(`${baseUrl}-${adminUsername}`).toString('base64').slice(0, 32)}`;
}

/**
 * Get token expiration time from configuration
 * @purpose Get token expiration duration from configuration with sensible default
 * @param {Object} config - Application configuration
 * @returns {number} Token expiration time in milliseconds
 * @usedBy Token storage to set appropriate expiration times
 */
function getTokenExpirationTime(config) {
  // Use configuration value or default to 3 hours
  const defaultExpiration = 3 * 60 * 60 * 1000; // 3 hours
  return config.commerce.tokenExpirationMs || defaultExpiration;
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

  // Add 5-minute buffer to avoid using tokens about to expire
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() > tokenData.expiresAt - bufferTime;
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

  const authErrorCodes = getAuthErrorCodes();
  const authErrorMessages = [
    'unauthorized',
    'forbidden',
    'invalid token',
    'token expired',
    'authentication',
  ];

  return (
    authErrorCodes.includes(error.status) ||
    authErrorCodes.includes(error.code) ||
    authErrorMessages.some((msg) => error.message && error.message.toLowerCase().includes(msg))
  );
}

/**
 * Clear all cached tokens (useful for testing and forced refresh)
 * @purpose Clear token storage for testing or security purposes
 * @usedBy Testing utilities and administrative functions
 */
function clearTokenCache() {
  tokenStorage.clear();
}

/**
 * Get token cache statistics (useful for monitoring)
 * @purpose Provide insights into token cache usage for monitoring
 * @returns {Object} Token cache statistics
 * @usedBy Monitoring and debugging functions
 */
function getTokenCacheStats() {
  const stats = {
    totalTokens: tokenStorage.size,
    tokenKeys: Array.from(tokenStorage.keys()),
    tokenAges: {},
  };

  for (const [key, tokenData] of tokenStorage.entries()) {
    if (tokenData.createdAt) {
      stats.tokenAges[key] = Date.now() - tokenData.createdAt;
    }
  }

  return stats;
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
  buildAdminTokenCacheKey,
  getTokenExpirationTime,
  isTokenExpired,
  isAuthenticationError,
  clearTokenCache,
  getTokenCacheStats,
};
