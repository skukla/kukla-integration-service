/**
 * Authentication Bootstrap Module
 * Determines and initializes the appropriate authentication method
 * Following Adobe App Builder patterns (bootstrapRaw vs bootstrapInExcShell)
 */

import { imsAuth } from './index.js';
import { customAuth } from './custom-auth.js';
import { getIMSConfig, isIMSConfigured } from './config.js';
import { config as appConfig } from '../../config/generated/config.js';

/**
 * Bootstrap authentication based on environment and configuration
 * @returns {Promise<Object>} Authentication result with method and user info
 */
export async function bootstrapAuth() {
  // Check if we're in Experience Cloud Shell
  if (window.Runtime || window.exc) {
    console.log('Running in Experience Cloud Shell - using Shell authentication');
    return bootstrapInExcShell();
  }
  
  // Check if IMS is configured and enabled
  if (isIMSConfigured()) {
    console.log('IMS configured - attempting IMS authentication');
    return bootstrapWithIMS();
  }
  
  // Check if custom auth is configured
  const appPassword = getAppPasswordConfig();
  if (appPassword.enabled) {
    console.log('Custom authentication enabled');
    return bootstrapWithCustomAuth();
  }
  
  // No authentication configured - allow access but warn
  console.warn('No authentication configured - allowing unrestricted access');
  return bootstrapRaw();
}

/**
 * Bootstrap in Experience Cloud Shell
 * @returns {Promise<Object>} Auth result
 */
async function bootstrapInExcShell() {
  // This would integrate with Experience Cloud Shell
  // Not applicable for your standalone deployment
  return {
    authenticated: false,
    method: 'excshell',
    error: 'Experience Cloud Shell not available'
  };
}

/**
 * Bootstrap with IMS authentication
 * @returns {Promise<Object>} Auth result
 */
async function bootstrapWithIMS() {
  try {
    const authenticated = await imsAuth.initialize();
    if (authenticated) {
      const userInfo = imsAuth.getUserInfo();
      return {
        authenticated: true,
        method: 'ims',
        user: userInfo,
        handler: imsAuth
      };
    }
  } catch (error) {
    console.error('IMS authentication failed:', error);
  }
  
  return {
    authenticated: false,
    method: 'ims',
    error: 'IMS authentication failed'
  };
}

/**
 * Bootstrap with custom authentication
 * @returns {Promise<Object>} Auth result
 */
async function bootstrapWithCustomAuth() {
  try {
    const authenticated = await customAuth.initialize();
    if (authenticated) {
      return {
        authenticated: true,
        method: 'custom',
        user: { authenticated: true },
        handler: customAuth
      };
    }
  } catch (error) {
    console.error('Custom authentication failed:', error);
  }
  
  return {
    authenticated: false,
    method: 'custom',
    error: 'Authentication required'
  };
}

/**
 * Bootstrap without authentication (raw mode)
 * @returns {Object} Auth result
 */
function bootstrapRaw() {
  // Mock auth objects similar to the template
  const mockAuth = {
    authenticated: true,
    method: 'none',
    user: { mock: true },
    getAuthHeaders: () => ({})
  };
  
  return mockAuth;
}

/**
 * Get app password configuration
 * @returns {Object} Password config
 */
function getAppPasswordConfig() {
  // Check for app password in generated config
  return {
    enabled: appConfig?.auth?.appPassword?.enabled || false
  };
}

/**
 * Get the appropriate auth handler
 * @returns {Object} Auth handler (imsAuth, customAuth, or mock)
 */
export async function getAuthHandler() {
  const result = await bootstrapAuth();
  
  switch (result.method) {
    case 'ims':
      return imsAuth;
    case 'custom':
      return customAuth;
    case 'none':
    default:
      // Return a mock handler that doesn't require auth
      return {
        getAuthHeaders: () => ({}),
        isAuthenticated: () => true,
        initialize: async () => true,
        clearAuth: () => {},
        redirectToLogin: () => {}
      };
  }
}