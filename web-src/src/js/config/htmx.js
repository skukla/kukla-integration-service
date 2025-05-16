/* HTMX Configuration */
import { showNotification } from '../utils/notifications.js';

/**
 * Initialize HTMX configuration and extensions
 * @param {Object} htmx - The HTMX instance
 */
export function initializeHtmx(htmx) {
    if (!htmx) {
        console.error('HTMX not found. Make sure it is loaded before initializing.');
        return;
    }

    // Configure HTMX default settings
    htmx.config = {
        // Use JSON as default content type
        defaultSwapStyle: 'innerHTML',
        defaultSettleDelay: 20,
        includeIndicatorStyles: false,
        historyCacheSize: 10,
        timeout: 10000, // 10 second timeout
        // Add custom attributes for Adobe-specific features
        attributes: [
            'hx-get',
            'hx-ext',
            'hx-on*',
            'hx-trigger',
            'hx-target',
            'hx-include',
            'hx-indicator'
        ]
    };

    // Custom HTMX extensions
    htmx.defineExtension('loading-states', {
        onEvent: function(name, evt) {
            // Handle loading states for buttons and forms
            if (name === "htmx:beforeRequest") {
                const target = evt.detail.elt;
                const loadingClass = target.getAttribute('data-loading-class') || 'loading';
                target.classList.add(loadingClass);
                
                // Handle loading text if specified
                const loadingText = target.getAttribute('data-loading-text');
                if (loadingText) {
                    target.dataset.originalText = target.innerText;
                    target.innerText = loadingText;
                }
            }
            
            if (name === "htmx:afterRequest") {
                const target = evt.detail.elt;
                const loadingClass = target.getAttribute('data-loading-class') || 'loading';
                target.classList.remove(loadingClass);
                
                // Restore original text if it was changed
                if (target.dataset.originalText) {
                    target.innerText = target.dataset.originalText;
                    delete target.dataset.originalText;
                }
            }
        }
    });

    // Custom HTMX events handler
    document.addEventListener('htmx:configRequest', (evt) => {
        // Add any custom headers or authentication tokens
        evt.detail.headers = evt.detail.headers || {};
        evt.detail.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            evt.detail.headers['X-CSRF-Token'] = csrfToken.content;
        }
    });

    // Error handling
    document.addEventListener('htmx:responseError', (evt) => {
        console.error('HTMX Request Error:', evt.detail.error);
        showNotification('Request failed. Please try again.', 'error');
    });

    // Success handling
    document.addEventListener('htmx:afterSettle', (evt) => {
        // Handle any post-request success actions
        const target = evt.detail.target;
        if (target.hasAttribute('data-success-message')) {
            const message = target.getAttribute('data-success-message');
            showNotification(message, 'success');
        }
    });
} 