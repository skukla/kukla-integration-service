/**
 * Adobe Commerce API integration
 * @module commerce/api/integration
 */

const { createClient } = require('./client');
const { loadConfig } = require('../../../config');
const {
  http: { buildHeaders },
} = require('../../core');
const { buildCommerceUrl } = require('../../core/routing');

/**
 * Creates OAuth 1.0 authorization header for Adobe Commerce
 * @param {Object} params - OAuth parameters
 * @param {string} params.COMMERCE_CONSUMER_KEY - OAuth consumer key
 * @param {string} params.COMMERCE_CONSUMER_SECRET - OAuth consumer secret
 * @param {string} params.COMMERCE_ACCESS_TOKEN - OAuth access token
 * @param {string} params.COMMERCE_ACCESS_TOKEN_SECRET - OAuth access token secret
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @returns {string} OAuth authorization header value
 */
function createOAuthHeader(params, method, url) {
  const crypto = require('crypto');

  const consumerKey = params.COMMERCE_CONSUMER_KEY;
  const consumerSecret = params.COMMERCE_CONSUMER_SECRET;
  const accessToken = params.COMMERCE_ACCESS_TOKEN;
  const accessTokenSecret = params.COMMERCE_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      'Missing OAuth 1.0 credentials. Required: COMMERCE_CONSUMER_KEY, COMMERCE_CONSUMER_SECRET, COMMERCE_ACCESS_TOKEN, COMMERCE_ACCESS_TOKEN_SECRET'
    );
  }

  // OAuth 1.0 parameters
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Parse URL to separate base URL and query parameters (like Postman does)
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  const queryParams = Object.fromEntries(urlObj.searchParams.entries());

  // Combine OAuth params and query params for signature (key difference from our old implementation)
  const allParams = { ...oauthParams, ...queryParams };

  // Create parameter string for signature
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  // Create base string for signature using base URL (not full URL)
  const baseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  // Generate signature
  const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');
  oauthParams.oauth_signature = signature;

  // Create authorization header (Postman style - no double encoding)
  const authHeader =
    'OAuth ' +
    Object.keys(oauthParams)
      .sort()
      .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

  return authHeader;
}

/**
 * Makes a Commerce API request with OAuth 1.0 authentication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} params - Request parameters including OAuth credentials
 * @returns {Promise<Object>} Response data
 */
async function makeCommerceRequest(url, options = {}, params = {}) {
  const config = loadConfig(params);

  // Let buildCommerceUrl handle the full URL construction
  const fullUrl = url.startsWith('http') ? url : buildCommerceUrl(config.commerce.baseUrl, url);

  // Create OAuth authorization header
  const authHeader = createOAuthHeader(params, options.method || 'GET', fullUrl);

  const client = createClient({}, params);
  return client.request(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      Authorization: authHeader,
      ...(options.headers || {}),
    },
  });
}

/**
 * Batches multiple Commerce API requests with OAuth 1.0 authentication
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} params - Request parameters including OAuth credentials
 * @returns {Promise<Array>} Array of responses
 */
async function batchCommerceRequests(requests, params = {}) {
  const client = createClient({}, params);
  return client.processBatch(requests, async (batch) => {
    return Promise.all(batch.map((req) => makeCommerceRequest(req.url, req.options, params)));
  });
}

module.exports = {
  makeCommerceRequest,
  batchCommerceRequests,
  createOAuthHeader,
};
