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
    initializeHtmx();
    // Initialize modal system
    initializeModal();
    // Initialize file browser
    initializeFileBrowser();
  } catch (error) {
    // Keep this error log as it's essential for debugging critical failures
    showNotification('Failed to initialize application', 'error');
  }
});
