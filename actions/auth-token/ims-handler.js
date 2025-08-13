/**
 * IMS OAuth Handler
 * Handles IMS OAuth code exchange for Web App flow
 * REMOVE THIS FILE when integrating with Commerce Admin SDK
 */

const { Core } = require('@adobe/aio-sdk');
const fetch = require('node-fetch');
const { errorResponse, successResponse } = require('../../lib/utils');

/**
 * Exchange IMS authorization code for access token
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Response object
 */
async function handleIMSCodeExchange(params) {
  const logger = Core.Logger('auth-token-ims', { level: params.LOG_LEVEL || 'info' });

  try {
    // Get authorization code from request
    const { code, state, redirect_uri } = params;
    
    if (!code) {
      return errorResponse(400, 'Missing authorization code', logger);
    }
    
    // Get IMS configuration from environment
    const clientId = process.env.IMS_CLIENT_ID;
    const clientSecret = process.env.IMS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      logger.error('IMS configuration missing');
      return errorResponse(500, 'IMS configuration not available', logger);
    }
    
    // Use provided redirect_uri or construct from origin
    const redirectUri = redirect_uri || 
      `${params.__ow_headers?.origin || 'https://285361-188maroonwallaby-stage.adobeio-static.net'}/`;
    
    // Exchange authorization code for access token
    const tokenUrl = 'https://ims-na1.adobelogin.com/ims/token/v3';
    
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    });
    
    logger.info('Exchanging authorization code for token', { 
      clientId, 
      redirectUri,
      hasCode: !!code,
      hasState: !!state 
    });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      logger.error('Token exchange failed', { 
        status: response.status, 
        error: responseData.error,
        description: responseData.error_description 
      });
      return errorResponse(
        response.status, 
        responseData.error_description || 'Token exchange failed', 
        logger
      );
    }
    
    // Extract user info from token if available
    let userId = null;
    let orgId = null;
    
    try {
      // IMS tokens are JWTs, we can decode the payload
      if (responseData.access_token) {
        const tokenParts = responseData.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          userId = payload.user_id || payload.sub;
          orgId = payload.org_id;
        }
      }
    } catch (e) {
      logger.warn('Could not decode token payload', { error: e.message });
    }
    
    logger.info('Token exchange successful', { userId, orgId });
    
    // Return tokens to frontend
    return successResponse({
      access_token: responseData.access_token,
      refresh_token: responseData.refresh_token,
      expires_in: responseData.expires_in,
      token_type: responseData.token_type || 'Bearer',
      user_id: userId,
      org_id: orgId,
      // Never return client_secret to frontend!
    }, logger);
    
  } catch (error) {
    logger.error('IMS OAuth error', { error: error.message, stack: error.stack });
    return errorResponse(500, 'Authentication failed', logger);
  }
}

/**
 * Validate app password for simple authentication
 * REMOVE THIS when integrating with Commerce Admin SDK
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Response object
 */
async function validateAppPassword(params) {
  const logger = Core.Logger('auth-token-password', { level: params.LOG_LEVEL || 'info' });
  
  const { password } = params;
  const appPassword = process.env.APP_PASSWORD;
  
  if (!appPassword) {
    return errorResponse(501, 'App password authentication not configured', logger);
  }
  
  if (password === appPassword) {
    return successResponse({ valid: true }, logger);
  }
  
  return errorResponse(401, 'Invalid password', logger);
}

module.exports = {
  handleIMSCodeExchange,
  validateAppPassword
};