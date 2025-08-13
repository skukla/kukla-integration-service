/**
 * IMS Authentication Module
 * Handles Adobe IMS authentication for the frontend application
 * Following Adobe App Builder authentication patterns
 */

import { getIMSConfig, isIMSConfigured } from './config.js';

/**
 * IMS Authentication Manager
 * Manages authentication state and token lifecycle
 */
export class IMSAuth {
  constructor() {
    this.config = getIMSConfig();
    this.initialized = false;
  }

  /**
   * Initialize authentication
   * @returns {Promise<boolean>} True if authenticated or auth disabled
   */
  async initialize() {
    if (this.initialized) return this.isAuthenticated();
    
    this.initialized = true;
    
    // If IMS is not enabled or configured, allow access
    if (!isIMSConfigured()) {
      console.info('IMS authentication not configured');
      return true;
    }
    
    // Check authentication status
    const authenticated = this.isAuthenticated();
    console.log('Auth check:', {
      authenticated,
      token: !!sessionStorage.getItem(this.config.storageKeys.token),
      expiresAt: sessionStorage.getItem(this.config.storageKeys.expiresAt),
      timeNow: Date.now()
    });
    
    if (!authenticated) {
      console.log('Not authenticated, redirecting to login...');
      this.redirectToLogin();
      return false;
    }
    
    return true;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    if (!this.config.enabled) return true;
    
    const token = sessionStorage.getItem(this.config.storageKeys.token);
    const expiresAt = sessionStorage.getItem(this.config.storageKeys.expiresAt);
    
    if (!token || !expiresAt) return false;
    
    // Check if token is expired (with buffer)
    const expiryTime = parseInt(expiresAt) - this.config.refreshBuffer;
    return Date.now() < expiryTime;
  }

  /**
   * Redirect to IMS login
   */
  redirectToLogin() {
    const state = this.generateState();
    sessionStorage.setItem('ims_auth_state', state);
    
    const authUrl = new URL(`${this.config.imsBase}/ims/authorize/v2`);
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('scope', this.config.scope);
    authUrl.searchParams.append('response_type', this.config.responseType);
    authUrl.searchParams.append('state', state);
    
    window.location.href = authUrl.toString();
  }


  /**
   * Get authorization headers for API requests
   * @returns {Object} Headers object with Authorization if authenticated
   */
  getAuthHeaders() {
    if (!this.config.enabled) return {};
    
    const token = sessionStorage.getItem(this.config.storageKeys.token);
    if (token && this.isAuthenticated()) {
      return {
        'Authorization': `Bearer ${token}`,
        'x-ims-org-id': sessionStorage.getItem(this.config.storageKeys.orgId) || ''
      };
    }
    
    return {};
  }

  /**
   * Logout user
   */
  logout() {
    this.clearAuth();
    
    // Redirect to IMS logout
    const logoutUrl = `${this.config.imsBase}/ims/logout/v1` +
      `?client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin)}`;
    
    window.location.href = logoutUrl;
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    Object.values(this.config.storageKeys).forEach(key => {
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem('ims_auth_state');
  }

  /**
   * Generate random state for OAuth flow
   * @returns {string} Random state string
   */
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current user info
   * @returns {Object} User information
   */
  getUserInfo() {
    return {
      userId: sessionStorage.getItem(this.config.storageKeys.userId),
      orgId: sessionStorage.getItem(this.config.storageKeys.orgId),
      isAuthenticated: this.isAuthenticated()
    };
  }
}

// Export singleton instance
export const imsAuth = new IMSAuth();