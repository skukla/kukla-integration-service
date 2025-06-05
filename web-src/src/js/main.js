/**
 * Main application entry point
 * @module main
 */
import { initializeFileBrowser } from './browser/file-browser.js';
import { checkBackendConnection } from './config.js';
import { initializeModal } from './core/modal.js';
import { initializeHtmx } from './htmx/config.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkBackendConnection();
    initializeHtmx();
    initializeModal();
    initializeFileBrowser();
  } catch (error) {
    // Log critical initialization errors that need attention
    console.error('Application initialization failed:', error);
  }
});
