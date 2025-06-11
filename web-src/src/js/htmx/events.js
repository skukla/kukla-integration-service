/**
 * HTMX Event Handlers
 * @module htmx/events
 */

import { handleError } from '../core/errors/index.js';
import { showModal, hideModal, handleModalContentSwap } from '../ui/components/modal/index.js';
import { showNotification } from '../ui/components/notifications/index.js';

// Event handler configuration
const EVENT_CONFIG = {
  LOADING_CLASS: 'is-loading',
  ERROR_CONTAINER: '#error-container',
  MODAL_CONTAINER: '#modal-container',
  TABLE_ROW: '.table-row',
  FILE_LIST: '#file-list',
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
  // Note: handleModalBeforeSwap is registered in modal/index.js to avoid duplicates
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

  // For delete buttons, show success notification immediately and close modal
  if (target.classList.contains('delete-confirm-button')) {
    if (event.detail.successful) {
      const successMessage = target.getAttribute('data-success-message');
      if (successMessage) {
        // Show success notification immediately
        showNotification(successMessage, 'success');
        // Close the modal
        hideModal();
      }
    } else {
      // If the request failed, remove loading state immediately
      target.classList.remove(loadingClass);

      // Restore original text
      if (target.dataset.originalText) {
        target.innerText = target.dataset.originalText;
        delete target.dataset.originalText;
      }
    }
    return; // Don't process further for delete buttons
  }

  // For all other buttons, remove loading state immediately
  target.classList.remove(loadingClass);

  // Restore original text
  if (target.dataset.originalText) {
    target.innerText = target.dataset.originalText;
    delete target.dataset.originalText;
  }

  // Handle success message - but skip download buttons, delete buttons, and export buttons as they have special handling
  if (
    event.detail.successful &&
    !target.classList.contains('download-button') &&
    !target.classList.contains('delete-confirm-button') &&
    !target.hasAttribute('data-export-method')
  ) {
    const successMessage = target.getAttribute('data-success-message');
    if (successMessage) {
      showNotification(successMessage, 'success');
    }
  }

  // Set up modal close handlers for dynamically loaded content
  if (event.detail.target && event.detail.target.id === 'modal-container') {
    setupModalCloseHandlers();
  }
}

/**
 * Set up modal close button handlers for dynamically loaded content
 */
function setupModalCloseHandlers() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  // Remove any existing listeners to prevent duplicates
  const existingCloseButtons = modalContainer.querySelectorAll('.modal-close');
  existingCloseButtons.forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });

  // Add click handler to all modal close buttons
  modalContainer.addEventListener('click', (e) => {
    const closeButton = e.target.closest('.modal-close');
    if (closeButton) {
      e.preventDefault();
      hideModal();
    }
  });
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
        canRetry: true,
      },
    };
  }
}

/**
 * Handle HTMX response error
 * @param {Event} event - HTMX event
 */
function handleResponseError(event) {
  const error = parseErrorResponse(event.detail);
  handleError(error);
}

/**
 * Handle request timeouts
 * @param {Event} _event - HTMX event
 */
// eslint-disable-next-line no-unused-vars
function handleTimeout(_event) {
  showNotification('Request timed out. Please try again.', 'error');
}

/**
 * Handle validation failures
 * @param {Event} event - HTMX event
 */
function handleValidationFailure(event) {
  const target = event.detail.elt;
  const message =
    target.getAttribute('data-validation-message') || 'Please check your input and try again.';
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

  // Handle file list updates after delete operation
  if (event.detail.target.classList.contains('table-content')) {
    // Check if the modal is currently open with delete content
    const modalContainer = document.getElementById('modal-container');
    const isDeleteModal = modalContainer && modalContainer.querySelector('.delete-confirm-button');

    if (isDeleteModal) {
      // Clean up the delete button loading state
      if (window._deleteButtonTarget) {
        const target = window._deleteButtonTarget;
        const loadingClass =
          target.getAttribute('data-loading-class') || EVENT_CONFIG.LOADING_CLASS;

        target.classList.remove(loadingClass);

        // Restore original text
        if (target.dataset.originalText) {
          target.innerText = target.dataset.originalText;
          delete target.dataset.originalText;
        }

        // Clean up the reference
        delete window._deleteButtonTarget;
      }

      // Close the modal immediately for a smooth transition
      hideModal();

      // Show the success message immediately
      if (window._deleteSuccessMessage) {
        showNotification(window._deleteSuccessMessage, 'success');
        delete window._deleteSuccessMessage;
      }
    }
  }

  // IMPORTANT: Check for orphaned delete success messages on ANY table content update
  // This handles race conditions where the message gets stuck between operations
  if (window._deleteSuccessMessage && !document.querySelector('.delete-confirm-button')) {
    showNotification(window._deleteSuccessMessage, 'success');
    delete window._deleteSuccessMessage;
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
 * @param {Event} _event - HTMX event
 */
// eslint-disable-next-line no-unused-vars
function handleHistoryRestore(_event) {
  // Restore any necessary state
}

/**
 * Handle actions before history save
 * @param {Event} _event - HTMX event
 */
// eslint-disable-next-line no-unused-vars
function handleBeforeHistorySave(_event) {
  // Clean up any temporary state before saving to history
}

/**
 * Handle network send errors
 * @param {Event} _event - HTMX event
 */
// eslint-disable-next-line no-unused-vars
function handleSendError(_event) {
  showNotification('Network error. Please check your connection and try again.', 'error');
}

/**
 * Handle content swap errors
 * @param {Event} _event - HTMX event
 */
// eslint-disable-next-line no-unused-vars
function handleSwapError(_event) {
  showNotification('Failed to update content. Please refresh the page.', 'error');
}
