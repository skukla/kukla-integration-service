/**
 * Mesh Resolvers - Utils Domain
 * Cache and authentication utilities for mesh resolvers
 *
 * This file contains low-level pure functions following our domain-driven architecture.
 * Cannot use require() in mesh environment, so all code is embedded.
 */

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

/**
 * Mesh configuration injected during generation
 * Mirrors our config/domains approach
 */
// eslint-disable-next-line no-undef
const meshConfig = __MESH_CONFIG__;

/**
 * Commerce base URL from configuration
 * Follows our configuration management patterns
 */
const commerceBaseUrl = '{{{COMMERCE_BASE_URL}}}';

/**
 * Cache TTL configuration
 * Mirrors our performance configuration approach
 */
const CACHE_TTL = parseInt('{{{MESH_CACHE_TTL}}}');

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Category cache storage
 * Mirrors our src/files/utils/cache.js patterns
 */
const categoryCache = new Map();

/**
 * Get cached category data
 * Pure function following our caching patterns
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Cached category data or null
 */
function getCachedCategory(categoryId) {
  const cached = categoryCache.get(categoryId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    categoryCache.delete(categoryId);
  }
  return null;
}

/**
 * Cache category data
 * Pure function following our caching patterns
 * @param {string} categoryId - Category ID
 * @param {Object} data - Category data
 */
function cacheCategory(categoryId, data) {
  categoryCache.set(categoryId, {
    timestamp: Date.now(),
    data: data,
  });
}

/**
 * Build category map from cache
 * Composition function following our utils patterns
 * @param {string[]} categoryIds - Array of category IDs
 * @returns {Object} Category map from cache
 */
function buildCategoryMapFromCache(categoryIds) {
  const categoryMap = {};
  categoryIds.forEach((id) => {
    const cached = getCachedCategory(id);
    if (cached) {
      categoryMap[id] = cached;
    }
  });
  return categoryMap;
}

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Percent encoding for OAuth (RFC 3986)
 * Pure function following our encoding patterns
 * @param {string} str - String to encode
 * @returns {string} Percent-encoded string
 */
function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * Pure function following our crypto patterns
 * @param {string} key - Signing key
 * @param {string} data - Data to sign
 * @returns {Promise<string>} Base64-encoded signature
 * @throws {Error} If signature generation fails
 */
async function generateHmacSignature(key, data) {
  try {
    // Convert strings to ArrayBuffer
    const keyBuffer = new TextEncoder().encode(key);
    const dataBuffer = new TextEncoder().encode(data);

    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Generate signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);

    // Convert to base64
    const signatureArray = new Uint8Array(signatureBuffer);
    let binaryString = '';
    for (let i = 0; i < signatureArray.length; i++) {
      binaryString += String.fromCharCode(signatureArray[i]);
    }

    return btoa(binaryString);
  } catch (error) {
    throw new Error('Failed to generate HMAC signature: ' + error.message);
  }
}

/**
 * Create OAuth 1.0 authorization header
 * Mirrors our src/commerce/utils/oauth.js implementation
 * @param {Object} oauthParams - OAuth parameters
 * @param {string} oauthParams.consumerKey - Consumer key
 * @param {string} oauthParams.consumerSecret - Consumer secret
 * @param {string} oauthParams.accessToken - Access token
 * @param {string} oauthParams.accessTokenSecret - Access token secret
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {Promise<string>} OAuth authorization header
 * @throws {Error} If OAuth credentials are missing or invalid
 */
async function createOAuthHeader(oauthParams, method, url) {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = oauthParams;

  // OAuth 1.0 parameters (following our patterns)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  // Parse URL to get base URL and parameters (Postman-style like our implementation)
  const urlObj = new URL(url);
  const baseUrl = urlObj.protocol + '//' + urlObj.host + urlObj.pathname;

  // Collect OAuth parameters
  const oauthSignatureParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Collect query parameters
  const queryParams = {};
  for (const [key, value] of urlObj.searchParams) {
    queryParams[key] = value;
  }

  // Combine all parameters for signature base
  const allParams = { ...oauthSignatureParams, ...queryParams };

  // Create parameter string (percent encode keys and values, then sort)
  const parameterString = Object.keys(allParams)
    .sort()
    .map((key) => percentEncode(key) + '=' + percentEncode(allParams[key]))
    .join('&');

  // Create signature base string
  const signatureBaseString =
    method.toUpperCase() + '&' + percentEncode(baseUrl) + '&' + percentEncode(parameterString);

  // Create signing key
  const signingKey = percentEncode(consumerSecret) + '&' + percentEncode(accessTokenSecret);

  // Generate signature
  const signature = await generateHmacSignature(signingKey, signatureBaseString);

  // Build authorization header
  const authParams = {
    ...oauthSignatureParams,
    oauth_signature: signature,
  };

  const authString = Object.keys(authParams)
    .sort()
    .map((key) => percentEncode(key) + '="' + percentEncode(authParams[key]) + '"')
    .join(', ');

  return 'OAuth ' + authString;
}

// Export functions for use in other resolver files
module.exports = {
  // Configuration
  meshConfig,
  commerceBaseUrl,
  CACHE_TTL,

  // Cache utilities
  getCachedCategory,
  cacheCategory,
  buildCategoryMapFromCache,

  // Authentication utilities
  percentEncode,
  generateHmacSignature,
  createOAuthHeader,
};
