/**
 * Main application entry point
 * @module main
 */
import { initializeHtmx } from './htmx/index.js';
import { initializeFileBrowser, initializeModal } from './ui/index.js';

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
