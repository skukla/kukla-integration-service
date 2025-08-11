/**
 * HTMX Configuration and Event Handling
 * Consolidated HTMX functionality for Adobe App Builder frontend
 */

import { config } from '../config/generated/config.js';
import { handleError } from './core/errors/index.js';
import {
  createSuccessNotificationContent,
  toggleEndpoints,
} from './ui/components/export-products/index.js';
import { handleModalContentSwap } from './ui/components/modal/index.js';
import { showNotification } from './ui/components/notifications/index.js';
import { initializeDownloadHandlers } from './ui/downloads/index.js';
import { getActionUrl } from './utils.js';

// ============================================================================
// HTMX CONFIGURATION
// ============================================================================

/**
 * Initialize HTMX configuration and event handlers
 */
export function initializeHtmx() {
  if (!window.htmx) {
    console.warn('HTMX not loaded, skipping initialization');
    return;
  }

  // Basic HTMX config
  window.htmx.config.timeout = config.performance.timeout;
  window.htmx.config.historyCacheSize = 0;
  window.htmx.config.withCredentials = false;
  window.htmx.config.globalViewTransitions = false;
  window.htmx.config.allowScriptTags = false;
  window.htmx.config.allowEval = false;

  // Initialize event handlers
  initializeEventHandlers();
  initializeDownloadHandlers(window.htmx);

  // HTMX initialized successfully
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Initialize all HTMX event handlers
 */
function initializeEventHandlers() {
  // Export handling with rich notifications
  window.htmx.on('htmx:beforeSwap', handleExportResponse);

  // Modal content handling
  window.htmx.on('htmx:afterSwap', handleModalContentSwap);

  // Error handling
  window.htmx.on('htmx:responseError', handleResponseError);
  window.htmx.on('htmx:timeout', handleTimeout);
  window.htmx.on('htmx:sendError', handleSendError);

  // Request lifecycle
  window.htmx.on('htmx:beforeRequest', handleBeforeRequest);
  window.htmx.on('htmx:afterRequest', handleAfterRequest);

  // Content management
  window.htmx.on('htmx:afterSettle', handleAfterSettle);

  // File browser integration
  setupFileBrowserHandlers();

  // Delete modal handlers
  setupDeleteModalHandlers();
}

/**
 * Handle export responses with rich notifications
 */
function handleExportResponse(event) {
  if (event.target.id !== 'export-result') return;

  const methodButton = document.querySelector('.htmx-request[data-export-method]');
  const methodName = methodButton?.dataset?.exportMethod
    ? methodButton.dataset.exportMethod
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Export';

  try {
    const response = JSON.parse(event.detail.xhr.responseText);

    if (response.success) {
      // Clear the target (no visible UI update)
      event.detail.serverResponse = '';

      // Auto-refresh file list FIRST, then show notification
      const notificationContent = createSuccessNotificationContent(response);
      refreshFileList(() => {
        // Show notification after file list updates
        setTimeout(() => {
          showNotification(notificationContent, {
            type: 'success',
            duration: 8000, // Longer duration for rich content
            cssClass: 'notification-rich', // Add class to hide default elements
          });
        }, 200); // Small delay for smooth transition
      });
    } else {
      // Clear the target for errors too
      event.detail.serverResponse = '';
      // Show error notification
      showNotification(
        `${methodName} Export Failed: ${response.message || response.error || 'Export failed'}`,
        {
          type: 'error',
          duration: 8000,
        }
      );
    }
  } catch (error) {
    console.error('Export response parse error:', error.message);
    // Clear the target for parsing errors
    event.detail.serverResponse = '';
    showNotification(`Failed to parse ${methodName} export response`, 'error');
  }
}

/**
 * Handle HTMX response errors
 */
function handleResponseError(event) {
  try {
    const error = JSON.parse(event.detail.xhr.response);
    showNotification(error.error?.message || 'Request failed', 'error');
  } catch {
    showNotification('Request failed', 'error');
  }
}

/**
 * Handle HTMX timeouts
 */
function handleTimeout() {
  showNotification('Request timed out. Please try again.', 'error');
}

/**
 * Handle HTMX send errors
 */
function handleSendError(event) {
  const errorMessage = event.detail.error || 'Network error occurred';
  handleError(new Error(errorMessage));
  showNotification('Connection failed. Please check your network.', 'error');
}

/**
 * Handle before request events
 */
function handleBeforeRequest(event) {
  const element = event.detail.elt;

  // Handle loading states for export buttons
  if (element?.classList.contains('export-btn')) {
    element.classList.add('is-loading');
  } else {
    // Show loading indicator if target has one
    const target = event.detail.target;
    if (target) {
      const indicator =
        target.querySelector('.loading-indicator') ||
        document.querySelector(`[data-indicator-for="${target.id}"]`);
      if (indicator) {
        indicator.style.display = 'block';
      }
    }
  }
}

/**
 * Handle after request events
 */
function handleAfterRequest(event) {
  const element = event.detail.elt;

  // Handle loading states for export buttons
  if (element?.classList.contains('export-btn')) {
    element.classList.remove('is-loading');
  } else {
    // Hide loading indicators
    const target = event.detail.target;
    if (target) {
      const indicator =
        target.querySelector('.loading-indicator') ||
        document.querySelector(`[data-indicator-for="${target.id}"]`);
      if (indicator) {
        indicator.style.display = 'none';
      }
    }
  }
}

/**
 * Handle after settle events
 */
function handleAfterSettle(event) {
  // Re-initialize any new components that were swapped in
  if (event.detail.target) {
    initializeSwappedContent(event.detail.target);
  }
}

/**
 * Initialize content that was swapped in by HTMX
 */
function initializeSwappedContent(container) {
  // Re-process any export buttons that were added
  const exportButtons = container.querySelectorAll('.export-btn[data-action]');
  if (exportButtons.length > 0 && window.htmx) {
    exportButtons.forEach((button) => {
      window.htmx.process(button);
    });
  }

  // Re-process any modal triggers
  const modalTriggers = container.querySelectorAll('[data-modal-trigger]');
  if (modalTriggers.length > 0 && window.htmx) {
    modalTriggers.forEach((trigger) => {
      window.htmx.process(trigger);
    });
  }
}

// ============================================================================
// DELETE MODAL INTEGRATION
// ============================================================================

/**
 * Set up delete modal specific HTMX handlers
 */
function setupDeleteModalHandlers() {
  // Handle successful delete operations from modal
  window.htmx.on('htmx:afterRequest', function (event) {
    const button = event.detail.elt;

    // Check if this is a delete confirmation button
    if (button.classList.contains('delete-confirm-button') && event.detail.successful) {
      // Hide the modal
      if (window.hideModal) {
        window.hideModal();
      }

      // Show success notification
      const fileName = button.dataset.fileName || 'File';
      if (window.showNotification) {
        window.showNotification(`${fileName} deleted successfully`, 'success');
      }

      // Auto-refresh file list after successful delete
      refreshFileList();
    }
  });
}

// ============================================================================
// FILE BROWSER INTEGRATION
// ============================================================================

/**
 * Set up file browser specific HTMX handlers
 */
function setupFileBrowserHandlers() {
  // Handle delete button clicks
  document.addEventListener('click', function (e) {
    // Handle endpoints toggle clicks
    if (e.target.closest('.endpoints-toggle')) {
      toggleEndpoints(e.target.closest('.endpoints-toggle'));
    }
  });

  // Note: Delete handling moved to setupDeleteModalHandlers()
}

// ============================================================================
// FILE BROWSER UTILITIES
// ============================================================================

/**
 * Refresh file list using HTMX
 * @param {Function} callback - Optional callback to run after refresh
 */
function refreshFileList(callback) {
  const fileListElement = document.querySelector('.table-content');
  if (fileListElement && window.htmx) {
    // Add loading state
    fileListElement.classList.add('is-updating');

    window.htmx.ajax('GET', getActionUrl('browse-files'), {
      target: '.table-content',
      swap: 'innerHTML',
      indicator: false,
    });

    // Listen for completion and trigger callback
    if (callback) {
      const handleUpdate = (event) => {
        // Only handle updates to our target
        if (event.detail.target === fileListElement) {
          // Remove loading state and call callback after brief delay
          setTimeout(() => {
            event.detail.target.classList.remove('is-updating');
            callback();
          }, 150);
          // Remove the event listener
          document.removeEventListener('htmx:afterSwap', handleUpdate);
        }
      };
      document.addEventListener('htmx:afterSwap', handleUpdate);
    }
  } else if (callback) {
    // If no HTMX, still call the callback
    callback();
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Track if we're currently doing initial page setup
 */
let isInitialPageSetup = true;

/**
 * Clear initial page setup flag
 */
// eslint-disable-next-line import/no-unused-modules
export function clearInitialPageSetup() {
  isInitialPageSetup = false;
}

/**
 * Check if we're in initial page setup
 */
// eslint-disable-next-line import/no-unused-modules
export function isInInitialPageSetup() {
  return isInitialPageSetup;
}
