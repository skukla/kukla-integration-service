/* Main JavaScript Entry Point */

// Import utilities
import { showNotification } from './utils/notifications.js';
import { initializeDelayedLoader } from './utils/content-loader.js';

// Modal handling
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContainer = document.getElementById('modal-container');

function showModal() {
    modalBackdrop.classList.add('active');
    document.body.classList.add('modal-open');
}

function hideModal() {
    modalBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
    modalContainer.innerHTML = '';
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize content loader with delay
    initializeDelayedLoader('content-loader', {
        url: 'https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/export-browser',
        target: '.table-content',
        delay: 2000
    });

    // Modal event listeners
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            hideModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
            hideModal();
        }
    });

    // HTMX event listeners for modal
    document.body.addEventListener('htmx:afterSwap', (e) => {
        if (e.detail.target.id === 'modal-container') {
            showModal();
        }
    });

    document.body.addEventListener('htmx:beforeSwap', (e) => {
        if (e.detail.target.closest('.table-row')) {
            hideModal();
        }
    });

    // HTMX event logging and error handling
    document.body.addEventListener('htmx:beforeRequest', e => {
        // Request is starting
    });
    
    document.body.addEventListener('htmx:afterRequest', e => {
        // Show success notification for delete operations
        if (e.detail.successful && e.detail.requestConfig.method === 'DELETE') {
            showNotification('File deleted successfully', 'success');
        }
    });

    document.body.addEventListener('htmx:responseError', e => {
        console.error('Request error:', e.detail);
        showNotification('Failed to load content. Please try again.', 'error');
    });

    // Add network error handling
    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may be unavailable.', 'warning');
    });
}); 