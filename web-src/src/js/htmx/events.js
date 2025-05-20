/**
 * HTMX Event Handlers
 * @module htmx/events
 */

import { showNotification } from '../core/notifications.js';
import { showModal, hideModal, handleModalContentSwap, handleModalBeforeSwap } from '../core/modal.js';
import { ErrorHandler } from '../core/error-handler.js';
import { showLoading, hideLoading } from '../core/loading.js';

// Event handler configuration
const EVENT_CONFIG = {
    LOADING_CLASS: 'is-loading',
    ERROR_CONTAINER: '#error-container',
    MODAL_CONTAINER: '#modal-container',
    TABLE_ROW: '.table-row',
    FILE_LIST: '#file-list'
};

/**
 * Initialize all HTMX event listeners
 */
export function initializeHtmxEvents() {
    // Request lifecycle events
    window.htmx.on('htmx:beforeRequest', handleBeforeRequest);
    window.htmx.on('htmx:afterRequest', handleAfterRequest);
    window.htmx.on('htmx:responseError', handleResponseError);
    window.htmx.on('htmx:timeout', handleTimeout);
    window.htmx.on('htmx:validation:failed', handleValidationFailure);
    
    // Content swap events
    window.htmx.on('htmx:beforeSwap', handleBeforeSwap);
    window.htmx.on('htmx:afterSwap', handleAfterSwap);
    window.htmx.on('htmx:afterSettle', handleAfterSettle);
    
    // History events
    window.htmx.on('htmx:historyRestore', handleHistoryRestore);
    window.htmx.on('htmx:beforeHistorySave', handleBeforeHistorySave);
    
    // Error events
    window.htmx.on('htmx:sendError', handleSendError);
    window.htmx.on('htmx:swapError', handleSwapError);

    // Modal events
    window.htmx.on('htmx:afterSwap', handleModalContentSwap);
    window.htmx.on('htmx:beforeSwap', handleModalBeforeSwap);
}

/**
 * Handle actions before request is sent
 * @param {Event} event - HTMX event
 */
function handleBeforeRequest(event) {
    const target = event.detail.elt;
    const loadingClass = target.getAttribute('data-loading-class') || EVENT_CONFIG.LOADING_CLASS;
    
    // Add loading state
    target.classList.add(loadingClass);
    
    // Store original text if loading text is specified
    const loadingText = target.getAttribute('data-loading-text');
    if (loadingText) {
        target.dataset.originalText = target.innerText;
        target.innerText = loadingText;
    }
}

/**
 * Handle successful request completion
 * @param {Event} event - HTMX event
 */
function handleAfterRequest(event) {
    const target = event.detail.elt;
    const loadingClass = target.getAttribute('data-loading-class') || EVENT_CONFIG.LOADING_CLASS;
    
    // Remove loading state
    target.classList.remove(loadingClass);
    
    // Restore original text
    if (target.dataset.originalText) {
        target.innerText = target.dataset.originalText;
        delete target.dataset.originalText;
    }
    
    // Handle success message
    if (event.detail.successful) {
        const successMessage = target.getAttribute('data-success-message');
        if (successMessage) {
            showNotification(successMessage, 'success');
        }
    }
}

/**
 * Parse error response from HTMX event
 * @param {Object} detail - HTMX event detail
 * @returns {Object} Parsed error object
 */
function parseErrorResponse(detail) {
    try {
        const response = detail.xhr.response;
        return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (e) {
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: 'Failed to parse error response',
                action: 'Please try again or contact support',
                canRetry: true
            }
        };
    }
}

/**
 * Handle HTMX response error
 * @param {Event} event - HTMX event
 */
function handleResponseError(event) {
    const error = parseErrorResponse(event.detail);
    ErrorHandler.handleError(error);
}

/**
 * Handle request timeouts
 * @param {Event} event - HTMX event
 */
function handleTimeout(event) {
    showNotification('Request timed out. Please try again.', 'error');
}

/**
 * Handle validation failures
 * @param {Event} event - HTMX event
 */
function handleValidationFailure(event) {
    const target = event.detail.elt;
    const message = target.getAttribute('data-validation-message') || 'Please check your input and try again.';
    showNotification(message, 'warning');
}

/**
 * Handle actions before content swap
 * @param {Event} event - HTMX event
 */
function handleBeforeSwap(event) {
    // Handle modal closing if swapping table rows
    if (event.detail.target.closest(EVENT_CONFIG.TABLE_ROW)) {
        hideModal();
    }
}

/**
 * Handle actions after content swap
 * @param {Event} event - HTMX event
 */
function handleAfterSwap(event) {
    // Remove focus from any focused elements
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    
    // Show modal if swapping modal content
    if (event.detail.target.id === 'modal-container') {
        showModal();
    }
    
    // Handle any custom swap triggers
    const swapTrigger = event.detail.target.getAttribute('data-swap-trigger');
    if (swapTrigger) {
        window.htmx.trigger(document.body, swapTrigger);
    }
}

/**
 * Handle actions after content has settled
 * @param {Event} event - HTMX event
 */
function handleAfterSettle(event) {
    // Only handle specific cases where we want to manage focus
    const target = event.detail.target;
    
    // If it's a modal, we might want to focus the first interactive element
    if (target.id === 'modal-container') {
        const focusable = target.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
            focusable.focus();
        }
    }
    // For all other cases, we don't automatically focus elements
}

/**
 * Handle history restoration
 * @param {Event} event - HTMX event
 */
function handleHistoryRestore(event) {
    // Restore any saved scroll positions
    const scrollPosition = event.detail.scroll || 0;
    window.scrollTo(0, scrollPosition);
}

/**
 * Handle actions before saving history
 * @param {Event} event - HTMX event
 */
function handleBeforeHistorySave(event) {
    // Save current scroll position
    event.detail.scroll = window.scrollY;
}

/**
 * Handle send errors (network issues, etc)
 * @param {Event} event - HTMX event
 */
function handleSendError(event) {
    showNotification('Failed to send request. Please check your connection.', 'error');
}

/**
 * Handle swap errors (invalid content, etc)
 * @param {Event} event - HTMX event
 */
function handleSwapError(event) {
    showNotification('Failed to update content. Please refresh the page.', 'error');
} 