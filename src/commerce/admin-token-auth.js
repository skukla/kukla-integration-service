/**
 * Commerce Admin Token Authentication
 * Complete admin token authentication capability with token caching and request integration
 */

const { request } = require('../shared/http/client');
const { buildCommerceUrl } = require('../shared/routing/commerce');

// Business Workflows

/**
 * Complete authenticated Commerce request with automatic token management
 * @purpose Execute Commerce API request with full admin token authentication lifecycle
 * @param {string} endpoint - Commerce API endpoint (relative path or full URL)
 * @param {Object} options - Request options (method, params, headers, etc.)
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object>} Commerce API response data
 * @throws {Error} When authentication fails or API request fails
 * @usedBy get-products action, get-products-mesh action, commerce operations
 * @config commerce.baseUrl, commerce.credentials (via params)
 */
async function executeAuthenticatedCommerceRequest(
  endpoint,
  options = {},
  config,
  params,
  trace = null
) {
  try {
    // Step 1: Validate admin credentials are available
    validateAdminCredentials(params);

    // Step 2: Get or generate admin token
    const adminToken = await getAdminToken(params, config, trace);

    // Step 3: Build authenticated request headers
    const authenticatedOptions = buildAuthenticatedRequestOptions(options, adminToken);

    // Step 4: Build full Commerce URL if needed
    const fullUrl = endpoint.startsWith('http')
      ? endpoint
      : buildCommerceUrl(config.commerce.baseUrl, endpoint);

    // Step 5: Execute authenticated request with retry on auth failure
    return await executeRequestWithAuthRetry(fullUrl, authenticatedOptions, params, config, trace);
  } catch (error) {
    throw new Error(`Authenticated Commerce request failed: ${error.message}`);
  }
}

/**
 * Batch authenticated Commerce requests with shared token
 * @purpose Execute multiple Commerce requests with single token for efficiency
 * @param {Array<Object>} requests - Array of request objects with endpoint and options
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of response objects
 * @usedBy Product enrichment workflows, batch data operations
 */
async function executeBatchAuthenticatedRequests(requests, config, params, trace = null) {
  try {
    // Step 1: Get admin token once for all requests
    const adminToken = await getAdminToken(params, config, trace);

    // Step 2: Build authenticated requests
    const authenticatedRequests = requests.map((req) => ({
      url: req.endpoint.startsWith('http')
        ? req.endpoint
        : buildCommerceUrl(config.commerce.baseUrl, req.endpoint),
      options: buildAuthenticatedRequestOptions(req.options || {}, adminToken),
    }));

    // Step 3: Execute requests in parallel
    const requestPromises = authenticatedRequests.map((req) => request(req.url, req.options));

    return await Promise.all(requestPromises);
  } catch (error) {
    throw new Error(`Batch authenticated requests failed: ${error.message}`);
  }
}

/**
 * Simple admin token retrieval
 * @purpose Get admin token for external use without making requests
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<string>} Admin bearer token
 * @usedBy External token usage, mesh resolver authentication
 */
async function getAdminTokenOnly(params, config, trace = null) {
  validateAdminCredentials(params);
  return await getAdminToken(params, config, trace);
}

// Feature Operations

/**
 * Get or generate admin token with caching
 * @purpose Coordinate admin token retrieval with automatic caching and refresh
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<string>} Admin bearer token
 * @usedBy executeAuthenticatedCommerceRequest, executeBatchAuthenticatedRequests
 */
async function getAdminToken(params, config, trace = null) {
  const cacheKey = buildTokenCacheKey(params);

  // Check cache first
  if (tokenCache.has(cacheKey)) {
    const cachedToken = tokenCache.get(cacheKey);
    if (!isTokenExpired(cachedToken)) {
      return cachedToken.token;
    }
  }

  // Generate new token
  const newToken = await generateAdminToken(params, config, trace);

  // Cache token with expiration
  const tokenEntry = {
    token: newToken,
    expiresAt: Date.now() + (TOKEN_CACHE_DURATION - TOKEN_REFRESH_BUFFER),
    createdAt: Date.now(),
  };

  tokenCache.set(cacheKey, tokenEntry);
  return newToken;
}

/**
 * Generate new admin token from Commerce API
 * @purpose Create fresh admin token using username/password authentication
 * @param {Object} params - Action parameters containing admin credentials
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<string>} Fresh admin bearer token
 * @usedBy getAdminToken
 */
async function generateAdminToken(params, config, trace = null) {
  const { COMMERCE_ADMIN_USERNAME: username, COMMERCE_ADMIN_PASSWORD: password } = params;

  if (!username || !password) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  const tokenUrl = buildCommerceUrl(config.commerce.baseUrl, '/integration/admin/token');

  // Track API call if trace context is provided
  if (trace && trace.incrementApiCalls) {
    trace.incrementApiCalls();
  }

  const response = await request(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.status} ${response.statusText}`);
  }

  const token = await response.json();
  return token; // Returns the bearer token string
}

/**
 * Execute request with authentication retry logic
 * @purpose Handle authenticated requests with automatic retry on auth failure
 * @param {string} url - Full request URL
 * @param {Object} options - Request options with auth headers
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} API response
 * @usedBy executeAuthenticatedCommerceRequest
 */
async function executeRequestWithAuthRetry(url, options, params, config, trace = null) {
  try {
    // First attempt with current token
    return await request(url, options);
  } catch (error) {
    // If authentication error, try with fresh token
    if (isAuthenticationError(error)) {
      // Clear cached token and retry with fresh token
      const cacheKey = buildTokenCacheKey(params);
      tokenCache.delete(cacheKey);

      const freshToken = await generateAdminToken(params, config, trace);
      const refreshedOptions = buildAuthenticatedRequestOptions(options, freshToken);

      return await request(url, refreshedOptions);
    }

    // Re-throw non-auth errors
    throw error;
  }
}

// Feature Utilities

/**
 * Build authenticated request options
 * @purpose Add admin token to request headers
 * @param {Object} options - Base request options
 * @param {string} adminToken - Admin bearer token
 * @returns {Object} Request options with authentication headers
 * @usedBy executeAuthenticatedCommerceRequest, executeBatchAuthenticatedRequests
 */
function buildAuthenticatedRequestOptions(options, adminToken) {
  return {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
}

/**
 * Validate admin credentials are present
 * @purpose Ensure required admin credentials are available
 * @param {Object} params - Action parameters to validate
 * @throws {Error} When credentials are missing
 * @usedBy executeAuthenticatedCommerceRequest, getAdminTokenOnly
 */
function validateAdminCredentials(params) {
  const { COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD } = params;

  if (!COMMERCE_ADMIN_USERNAME || !COMMERCE_ADMIN_PASSWORD) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  if (typeof COMMERCE_ADMIN_USERNAME !== 'string' || typeof COMMERCE_ADMIN_PASSWORD !== 'string') {
    throw new Error('Admin credentials must be strings');
  }
}

/**
 * Build token cache key
 * @purpose Create unique cache key for admin token based on credentials
 * @param {Object} params - Action parameters containing credentials
 * @returns {string} Cache key for token storage
 * @usedBy getAdminToken, executeRequestWithAuthRetry
 */
function buildTokenCacheKey(params) {
  const { COMMERCE_ADMIN_USERNAME } = params;
  // Use username as cache key (don't include password in key for security)
  return `admin_token_${COMMERCE_ADMIN_USERNAME}`;
}

/**
 * Check if token is expired
 * @purpose Determine if cached token needs refresh
 * @param {Object} tokenEntry - Cached token entry with expiration
 * @returns {boolean} True if token is expired
 * @usedBy getAdminToken
 */
function isTokenExpired(tokenEntry) {
  return Date.now() > tokenEntry.expiresAt;
}

/**
 * Check if error is authentication-related
 * @purpose Identify errors that should trigger token refresh
 * @param {Error} error - Error to analyze
 * @returns {boolean} True if error indicates authentication failure
 * @usedBy executeRequestWithAuthRetry
 */
function isAuthenticationError(error) {
  const authErrorPatterns = [
    'unauthorized',
    'invalid token',
    'token expired',
    'authentication failed',
    '401',
  ];

  const errorMessage = error.message.toLowerCase();
  return authErrorPatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Clear token cache
 * @purpose Force token refresh by clearing cached tokens
 * @param {Object} [params] - Optional params to clear specific token, or all if not provided
 * @usedBy External cache management, testing scenarios
 */
function clearTokenCache(params = null) {
  if (params) {
    const cacheKey = buildTokenCacheKey(params);
    tokenCache.delete(cacheKey);
  } else {
    tokenCache.clear();
  }
}

/**
 * Get token cache statistics
 * @purpose Provide cache performance information for monitoring
 * @returns {Object} Cache statistics including size and hit ratios
 * @usedBy Monitoring, debugging, performance analysis
 */
function getTokenCacheStats() {
  const entries = Array.from(tokenCache.values());

  return {
    totalEntries: tokenCache.size,
    activeEntries: entries.filter((entry) => !isTokenExpired(entry)).length,
    expiredEntries: entries.filter((entry) => isTokenExpired(entry)).length,
    oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.createdAt)) : null,
    newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.createdAt)) : null,
  };
}

// Token Cache Management
const tokenCache = new Map();
const TOKEN_CACHE_DURATION = 3600000; // 1 hour in milliseconds
const TOKEN_REFRESH_BUFFER = 300000; // 5 minutes buffer before expiration

module.exports = {
  // Business workflows (main exports that actions import)
  executeAuthenticatedCommerceRequest,
  executeBatchAuthenticatedRequests,
  getAdminTokenOnly,

  // Feature operations (coordination functions)
  getAdminToken,
  generateAdminToken,
  executeRequestWithAuthRetry,

  // Feature utilities (building blocks)
  buildAuthenticatedRequestOptions,
  validateAdminCredentials,
  buildTokenCacheKey,
  isTokenExpired,
  isAuthenticationError,
  clearTokenCache,
  getTokenCacheStats,
};
