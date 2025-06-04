/**
 * Main application entry point
 * @module main
 */
import { initializeFileBrowser } from './browser/file-browser.js';
import { initializeModal } from './core/modal.js';
import { showNotification } from './core/notifications.js';
import { initializeHtmx } from './htmx/config.js';

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize HTMX
    console.log('Initializing HTMX...');
    initializeHtmx();

    // Initialize modal system
    console.log('Initializing modal system...');
    initializeModal();

    // Initialize file browser
    console.log('Initializing file browser...');
    initializeFileBrowser();

    console.log('Application initialized successfully');
  } catch (error) {
    // Enhanced error logging
    console.error('Application initialization failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    // Show user-friendly notification
    showNotification('Failed to initialize application', {
      type: 'error',
      duration: 0,
      action: 'Refresh',
      onAction: () => window.location.reload(),
    });
  }
});
