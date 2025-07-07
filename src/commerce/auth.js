/**
 * Commerce Authentication Module
 * @module commerce/auth
 *
 * Provides OAuth 1.0 and admin token authentication for Adobe Commerce API integration.
 * Uses functional composition with pure functions and clear input/output contracts.
 */

const { buildCommerceUrl } = require('../shared');
const { incrementApiCalls } = require('../shared');

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
 * @throws {Error} When OAuth credentials are missing
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

  // Combine OAuth params and query params for signature (Postman-compatible approach)
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
 * Generate admin token using username/password authentication
 * @param {Object} params - Parameters containing admin credentials
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<string>} Admin bearer token
 * @throws {Error} When admin credentials are missing or authentication fails
 */
async function getAuthToken(params, config, trace = null) {
  const username = params.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  const tokenUrl = buildCommerceUrl(config.commerce.baseUrl, '/integration/admin/token');

  // Track API call if trace context is provided
  if (trace) {
    incrementApiCalls(trace);
  }

  const response = await fetch(tokenUrl, {
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
 * Validates OAuth credentials are present in parameters
 * @param {Object} params - Parameters to validate
 * @param {string} params.COMMERCE_CONSUMER_KEY - OAuth consumer key
 * @param {string} params.COMMERCE_CONSUMER_SECRET - OAuth consumer secret
 * @param {string} params.COMMERCE_ACCESS_TOKEN - OAuth access token
 * @param {string} params.COMMERCE_ACCESS_TOKEN_SECRET - OAuth access token secret
 * @returns {boolean} True if all OAuth credentials are present
 */
function validateOAuthCredentials(params) {
  return !!(
    params.COMMERCE_CONSUMER_KEY &&
    params.COMMERCE_CONSUMER_SECRET &&
    params.COMMERCE_ACCESS_TOKEN &&
    params.COMMERCE_ACCESS_TOKEN_SECRET
  );
}

/**
 * Validates admin credentials are present in parameters
 * @param {Object} params - Parameters to validate
 * @param {string} params.COMMERCE_ADMIN_USERNAME - Admin username
 * @param {string} params.COMMERCE_ADMIN_PASSWORD - Admin password
 * @returns {boolean} True if admin credentials are present
 */
function validateAdminCredentials(params) {
  return !!(params.COMMERCE_ADMIN_USERNAME && params.COMMERCE_ADMIN_PASSWORD);
}

/**
 * Extracts OAuth credentials from parameters into a clean object
 * @param {Object} params - Parameters containing OAuth credentials
 * @returns {Object} OAuth credentials object
 */
function extractOAuthCredentials(params) {
  return {
    consumerKey: params.COMMERCE_CONSUMER_KEY,
    consumerSecret: params.COMMERCE_CONSUMER_SECRET,
    accessToken: params.COMMERCE_ACCESS_TOKEN,
    accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
  };
}

/**
 * Extracts admin credentials from parameters into a clean object
 * @param {Object} params - Parameters containing admin credentials
 * @returns {Object} Admin credentials object
 */
function extractAdminCredentials(params) {
  return {
    username: params.COMMERCE_ADMIN_USERNAME,
    password: params.COMMERCE_ADMIN_PASSWORD,
  };
}

module.exports = {
  createOAuthHeader,
  getAuthToken,
  validateOAuthCredentials,
  validateAdminCredentials,
  extractOAuthCredentials,
  extractAdminCredentials,
};
