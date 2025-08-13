/**
 * OAuth Callback Handler
 * Handles OAuth callback separately to keep main auth module clean
 */

import { getIMSConfig } from './config.js';

/**
 * Check if current URL is an OAuth callback
 */
export function isOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const hasCode = urlParams.has('code');
  const hasError = urlParams.has('error');
  
  console.log('OAuth callback check:', {
    url: window.location.href,
    hasCode,
    hasError,
    params: Object.fromEntries(urlParams)
  });
  
  return hasCode || hasError;
}

/**
 * Handle OAuth callback
 * @returns {Promise<boolean>} True if successfully handled
 */
export async function handleOAuthCallback() {
  const config = getIMSConfig();
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  // Handle errors from IMS
  if (error) {
    console.error('Authentication error:', error);
    clearAuthData();
    cleanupAndReload();
    return false;
  }
  
  // Validate state to prevent CSRF
  const savedState = sessionStorage.getItem('ims_auth_state');
  if (!state || state !== savedState) {
    console.error('State mismatch - possible CSRF attack');
    clearAuthData();
    cleanupAndReload();
    return false;
  }
  
  if (!code) {
    console.error('No authorization code received');
    clearAuthData();
    cleanupAndReload();
    return false;
  }
  
  try {
    // Show loading indicator
    showLoadingIndicator();
    
    console.log('Exchanging authorization code for token...');
    
    // Exchange authorization code for access token
    const response = await fetch('/api/auth-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'ims-exchange',
        code: code,
        state: state,
        redirect_uri: config.redirectUri
      })
    });
    
    console.log('Token exchange response:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(errorData.error || 'Token exchange failed');
    }
    
    const tokenData = await response.json();
    console.log('Token received:', {
      hasToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in
    });
    
    // Store tokens in session storage
    storeTokenData(tokenData, config);
    
    // Clean up and reload
    sessionStorage.removeItem('ims_auth_state');
    console.log('Authentication complete, redirecting to app...');
    cleanupAndReload();
    
    return true;
    
  } catch (error) {
    console.error('Failed to exchange authorization code:', error);
    clearAuthData();
    cleanupAndReload();
    return false;
  }
}

/**
 * Store token data in session storage
 */
function storeTokenData(tokenData, config) {
  const expiresAt = Date.now() + ((tokenData.expires_in || 86400) * 1000);
  
  sessionStorage.setItem(config.storageKeys.token, tokenData.access_token);
  sessionStorage.setItem(config.storageKeys.expiresAt, expiresAt.toString());
  
  if (tokenData.user_id) {
    sessionStorage.setItem(config.storageKeys.userId, tokenData.user_id);
  }
  if (tokenData.org_id) {
    sessionStorage.setItem(config.storageKeys.orgId, tokenData.org_id);
  }
}

/**
 * Clear all auth data
 */
function clearAuthData() {
  const config = getIMSConfig();
  Object.values(config.storageKeys).forEach(key => {
    sessionStorage.removeItem(key);
  });
  sessionStorage.removeItem('ims_auth_state');
}

/**
 * Show loading indicator during OAuth processing
 */
function showLoadingIndicator() {
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h2>Completing authentication...</h2>
        <p>Please wait...</p>
      </div>
    </div>
  `;
}

/**
 * Clean up URL and reload
 */
function cleanupAndReload() {
  // Always redirect to root, removing query parameters
  window.history.replaceState({}, document.title, '/');
  window.location.href = '/';
}