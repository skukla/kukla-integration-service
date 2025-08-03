/**
 * Main application entry point
 * @module main
 */
import { initializeExportProductsUI } from './components/export-products-ui.js';
import { initializeHtmx } from './htmx/index.js';
import { showNotification } from './ui/components/notifications/index.js';
import { initializeFileBrowser, initializeModal, hideModal } from './ui/index.js';

// Make functions globally available for HTMX handlers
window.showDownloadNotification = function (filename) {
  showNotification(`${filename} downloaded successfully`, 'success');
};

window.hideModal = hideModal;
window.showNotification = showNotification;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    initializeHtmx();
    initializeModal();
    initializeFileBrowser();
    initializeExportProductsUI();
  } catch (error) {
    // Log critical initialization errors that need attention
    console.error('Application initialization failed:', error);
  }
});
