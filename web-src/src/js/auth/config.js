/**
 * IMS Authentication Configuration
 * Adobe App Builder standard IMS integration configuration
 */

import { config as appConfig } from '../../config/generated/config.js';

/**
 * Get IMS configuration from environment or defaults
 * @returns {Object} IMS configuration object
 */
export function getIMSConfig() {
  // Get IMS config from generated config - check both old and new structure
  const generatedConfig = appConfig?.auth?.ims || appConfig?.ims || {};
  
  return {
    // Feature flag to enable/disable IMS authentication
    enabled: generatedConfig.enabled !== false,
    
    // IMS endpoints
    imsBase: 'https://ims-na1.adobelogin.com',
    
    // OAuth configuration
    clientId: generatedConfig.clientId || '',
    clientSecret: generatedConfig.clientSecret || '', // For OAuth Web App
    redirectUri: `${window.location.origin}/`,
    scope: generatedConfig.scope || 'openid,AdobeID',
    responseType: 'code', // Changed from 'token' to 'code' for OAuth Web App
    
    // Token storage keys
    storageKeys: {
      token: 'ims_access_token',
      expiresAt: 'ims_expires_at',
      userId: 'ims_user_id',
      orgId: 'ims_org_id'
    },
    
    // Token refresh buffer (5 minutes before expiry)
    refreshBuffer: 5 * 60 * 1000
  };
}

/**
 * Check if IMS authentication is properly configured
 * @returns {boolean} True if configuration is valid
 */
export function isIMSConfigured() {
  const config = getIMSConfig();
  return config.enabled && config.clientId;
}