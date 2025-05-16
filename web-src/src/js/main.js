/* Main JavaScript Entry Point */

// Import styles
import '../main.css';

// Import utilities
import { showNotification } from './utils/notifications.js';

// Modal handling
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContainer = document.getElementById('modal-container');

function showModal() {
    modalBackdrop.classList.add('show');
    document.body.classList.add('modal-open');
}

function hideModal() {
    modalBackdrop.classList.remove('show');
    document.body.classList.remove('modal-open');
    modalContainer.innerHTML = '';
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Modal event listeners
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            hideModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('show')) {
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
        if (e.detail.target.closest('.spectrum-Table-row')) {
            hideModal();
        }
    });

    // HTMX event logging and error handling
    document.body.addEventListener('htmx:beforeRequest', e => {
        console.log('Request starting:', e.detail.requestConfig);
    });
    
    document.body.addEventListener('htmx:afterRequest', e => {
        console.log('Request finished:', {
            successful: e.detail.successful,
            failed: e.detail.failed,
            response: e.detail.xhr.responseText
        });

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