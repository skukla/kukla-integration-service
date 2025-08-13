/**
 * Main application entry point - Adobe App Builder frontend
 * Coordinates HTMX integration and application startup
 * Uses bootstrap pattern similar to Adobe's excshell template
 */
import { initializeApp } from './app.js';
import { initializeHtmx } from './htmx.js';
import { bootstrapAuth } from './auth/bootstrap.js';
import { isOAuthCallback, handleOAuthCallback } from './auth/oauth-handler.js';

// Store auth handler globally for HTMX integration
window.authHandler = null;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Handle OAuth callback first if present
    if (isOAuthCallback()) {
      await handleOAuthCallback();
      return; // Page will reload after handling
    }
    
    // Bootstrap authentication based on environment
    const authResult = await bootstrapAuth();
    
    if (authResult.authenticated) {
      // Store the auth handler for use in HTMX
      window.authHandler = authResult.handler || { getAuthHeaders: () => ({}) };
      
      // User is authenticated, initialize the app
      initializeHtmx();
      initializeApp();
      
      console.log(`Application initialized with ${authResult.method} authentication`);
    } else if (authResult.method === 'none') {
      // No auth configured, proceed anyway
      window.authHandler = { getAuthHeaders: () => ({}) };
      
      initializeHtmx();
      initializeApp();
      
      console.warn('Application running without authentication');
    }
    // If authentication failed, the auth module will handle it (redirect/prompt)
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
});
