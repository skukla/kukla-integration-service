/**
 * Main application entry point - Adobe App Builder frontend
 * Coordinates HTMX integration and application startup
 */
import { initializeApp } from './app.js';
import { initializeHtmx } from './htmx.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  try {
    initializeHtmx();
    initializeApp();
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
});
