/* 
* <license header>
*/

/* This file exposes some common utilities for your actions */

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters (params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  
  // check for missing headers and parameters
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  const missingParams = getMissingKeys(params, requiredParams)
  
  // combine error messages if any missing inputs
  const missingInputs = []
  if (missingHeaders.length > 0) missingInputs.push(`header(s) '${missingHeaders}'`)
  if (missingParams.length > 0) missingInputs.push(`parameter(s) '${missingParams}'`)
  
  return missingInputs.length > 0 ? `missing ${missingInputs.join(' and ')}` : null
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken (params) {
  if (params.__ow_headers &&
      params.__ow_headers.authorization &&
      params.__ow_headers.authorization.startsWith('Bearer ')) {
    return params.__ow_headers.authorization.substring('Bearer '.length)
  }
  return undefined
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}

/**
 * Builds headers for requests, including Authorization if present.
 * @param {string|undefined} token - Bearer token for authentication (optional)
 * @returns {Object} Headers object
 */
function buildHeaders(token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const fetch = require('node-fetch');

/**
 * Validates admin credentials and throws if they're invalid.
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @throws {Error} If credentials are missing
 */
function validateAdminCredentials(username, password) {
  if (!username || !password) {
    throw new Error('Missing required credentials: username and password must be provided');
  }
}

/**
 * Logs admin token request parameters (safely).
 * @param {object} params - Request parameters
 */
function logAdminTokenRequest(params) {
  console.log('[fetchAdminToken] Debugging params:', {
    COMMERCE_URL: params.COMMERCE_URL,
    COMMERCE_ADMIN_USERNAME: params.COMMERCE_ADMIN_USERNAME,
    COMMERCE_ADMIN_PASSWORD: params.COMMERCE_ADMIN_PASSWORD ? '***' : undefined
  });
}

/**
 * Fetches an admin token from Adobe Commerce using admin credentials.
 * @param {object} params - Request parameters containing credentials
 * @returns {Promise<string>} The admin Bearer token
 * @throws {Error} If the request fails or credentials are invalid
 */
async function fetchAdminToken(params = {}) {
  logAdminTokenRequest(params);
  
  const username = params.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD;
  const url = `${params.COMMERCE_URL}/rest/V1/integration/admin/token`;
  
  validateAdminCredentials(username, password);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const text = await res.text();
  if (!res.ok) {
    console.log('[fetchAdminToken] Admin token fetch failed:', text);
    throw new Error(`Failed to fetch admin token: ${res.status} ${text}`);
  }

  return JSON.parse(text);
}

module.exports = {
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  buildHeaders,
  fetchAdminToken
}
