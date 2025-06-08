/**
 * Main application entry point
 * @module main
 */
import { initializeFileBrowser } from './browser/file-browser.js';
import { initializeModal } from './core/modal.js';
import { initializeHtmx } from './htmx/setup.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    initializeHtmx();
    initializeModal();
    initializeFileBrowser();
  } catch (error) {
    // Log critical initialization errors that need attention
    console.error('Application initialization failed:', error);
  }
});
