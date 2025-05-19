/* Main JavaScript Entry Point */

// Import utilities
import { showNotification } from './core/notifications.js';
import { getActionUrl } from './core/urls.js';
import { handleDeleteResult } from './core/notifications.js';
import { initializeModal } from './core/modal.js';
import { initializeFileBrowser } from './browser/file-browser.js';
import { initializeHtmx } from './htmx/config.js';

// Make utilities available globally
window.showNotification = showNotification;
window.handleDeleteResult = handleDeleteResult;
window.getActionUrl = getActionUrl;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize HTMX first
    initializeHtmx();
    
    // Initialize other modules that depend on HTMX
    initializeModal();
    initializeFileBrowser();
    
    // Network error handling
    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may be unavailable.', 'warning');
    });
}); 