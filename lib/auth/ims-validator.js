/**
 * IMS Token Validation Module
 * Validates Adobe IMS tokens for backend actions
 * Following Adobe App Builder security best practices
 */

const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');

/**
 * Validate IMS access token
 * @param {string} token - IMS access token
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object|null>} Token info if valid, null if invalid
 */
async function validateIMSToken(token, logger = null) {
  const log = logger || Core.Logger('ims-validator');
  
  if (!token) {
    log.debug('No token provided');
    return null;
  }
  
  try {
    // IMS token validation endpoint
    const validationUrl = 'https://ims-na1.adobelogin.com/ims/validate_token/v1';
    
    const response = await fetch(validationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      log.debug('Token validation failed', { status: response.status });
      return null;
    }
    
    const tokenInfo = await response.json();
    
    // Check if token is valid and not expired
    if (tokenInfo.valid !== true) {
      log.debug('Token is invalid');
      return null;
    }
    
    // Check expiration
    const expiresAt = tokenInfo.expires_at || tokenInfo.expires_in;
    if (expiresAt && Date.now() >= expiresAt) {
      log.debug('Token is expired');
      return null;
    }
    
    log.debug('Token validated successfully', { 
      userId: tokenInfo.user_id,
      orgId: tokenInfo.org_id 
    });
    
    return {
      valid: true,
      userId: tokenInfo.user_id,
      orgId: tokenInfo.org_id,
      email: tokenInfo.email,
      scopes: tokenInfo.scope ? tokenInfo.scope.split(' ') : []
    };
    
  } catch (error) {
    log.error('Token validation error', { error: error.message });
    return null;
  }
}

/**
 * Extract and validate IMS token from request headers
 * @param {Object} headers - Request headers
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object|null>} Token info if valid, null if invalid
 */
async function validateIMSFromHeaders(headers, logger = null) {
  const authorization = headers?.authorization || headers?.Authorization;
  
  if (!authorization) {
    return null;
  }
  
  // Extract Bearer token
  const token = authorization.replace(/^Bearer\s+/i, '');
  
  return validateIMSToken(token, logger);
}

/**
 * Middleware-style auth validator for actions
 * @param {Object} params - Action parameters
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Auth result with status and info
 */
async function validateAuth(params, logger = null) {
  const log = logger || Core.Logger('auth-validator');
  
  // Check for IMS token in headers
  const imsInfo = await validateIMSFromHeaders(params.__ow_headers, log);
  
  if (imsInfo) {
    log.info('IMS authentication successful', { userId: imsInfo.userId });
    return {
      authenticated: true,
      method: 'ims',
      user: imsInfo,
      // When IMS authenticated, use Commerce creds from environment
      commerceAuth: {
        username: process.env.COMMERCE_ADMIN_USERNAME,
        password: process.env.COMMERCE_ADMIN_PASSWORD
      }
    };
  }
  
  // No valid authentication found
  log.warn('No valid authentication provided');
  return {
    authenticated: false,
    method: null,
    error: 'IMS authentication required. Please authenticate using Adobe IMS.'
  };
}

module.exports = {
  validateIMSToken,
  validateIMSFromHeaders,
  validateAuth
};