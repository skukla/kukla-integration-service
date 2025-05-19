/**
 * Main application entry point
 * @module main
 */

import { initializeHtmx } from './htmx/config.js';
import { initializeModal } from './core/modal.js';
import { initializeFileBrowser } from './browser/file-browser.js';
import { showNotification } from './core/notifications.js';

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
        console.error('Failed to initialize application:', error);
        showNotification('Failed to initialize application', 'error');
    }
}); 