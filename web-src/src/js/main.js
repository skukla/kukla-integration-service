/**
 * Main application entry point - Adobe App Builder frontend
 * Simplified frontend with HTMX integration and rich notifications
 */
import {
  createSuccessNotificationContent,
  toggleEndpoints,
} from './components/export-products-ui.js';
import { config } from '../config/generated/config.js';

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================
function showNotification(message, options = {}) {
  // Handle string shorthand for type
  if (typeof options === 'string') {
    options = { type: options };
  }

  const { type = 'info', duration = 5000, cssClass } = options;

  // Get or create container
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  // Create notification
  const notification = document.createElement('div');
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  notification.className = `notification notification-${type}${cssClass ? ` ${cssClass}` : ''}`;

  // Support rich HTML content or simple message
  if (typeof message === 'string' && !message.includes('<')) {
    // Simple message
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close" aria-label="Close notification">✕</button>
    `;
  } else {
    // Rich HTML content
    notification.innerHTML = `
      ${message}
      <button class="notification-close" aria-label="Close notification">✕</button>
    `;
  }

  // Add close handler
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      removeNotification(notification, container);
    });
  }

  container.appendChild(notification);
  container.style.display = 'flex';

  // Animate in
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Auto remove with hover pause functionality
  setupNotificationAutoRemoval(notification, container, duration);
}

/**
 * Setup auto-removal with hover pause functionality
 */
function setupNotificationAutoRemoval(notification, container, duration) {
  let timeoutId;
  let startTime = Date.now();
  let remainingTime = duration;
  let isPaused = false;

  function scheduleRemoval() {
    timeoutId = setTimeout(() => {
      if (!isPaused) {
        removeNotification(notification, container);
      }
    }, remainingTime);
  }

  function pauseTimer() {
    if (!isPaused && timeoutId) {
      clearTimeout(timeoutId);
      remainingTime -= Date.now() - startTime;
      isPaused = true;
      notification.classList.add('notification-paused');
    }
  }

  function resumeTimer() {
    if (isPaused) {
      startTime = Date.now();
      isPaused = false;
      notification.classList.remove('notification-paused');
      scheduleRemoval();
    }
  }

  // Add hover event listeners
  notification.addEventListener('mouseenter', pauseTimer);
  notification.addEventListener('mouseleave', resumeTimer);

  // Start the initial timer
  scheduleRemoval();

  // Store cleanup function on the notification for manual removal
  notification._cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

function removeNotification(notification, container) {
  if (!notification.parentNode) return;

  // Clean up any pending timeouts
  if (notification._cleanup) {
    notification._cleanup();
  }

  notification.classList.add('hide');
  setTimeout(() => {
    notification.remove();
    if (container.children.length === 0) {
      container.style.display = 'none';
    }
  }, 300);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Get action URL helper
function getActionUrl(action, params = {}) {
  let url = config.runtime.actions[action] || `/api/${action}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += '?' + searchParams.toString();
    }
  }
  return url;
}

// ============================================================================
// MODAL SYSTEM
// ============================================================================

// Modal helpers
function showModal() {
  const modal = document.querySelector('.modal-backdrop');
  if (modal) {
    // Add the active class that the CSS expects
    modal.classList.add('active');
    // Ensure display is set to grid (the CSS uses display: grid)
    modal.style.display = 'grid';
  }
}

function hideModal() {
  const modal = document.querySelector('.modal-backdrop');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

// ============================================================================
// HTMX CONFIGURATION & EVENT HANDLING
// ============================================================================

// HTMX configuration
function initializeHtmx() {
  if (!window.htmx) return;

  // Basic HTMX config
  window.htmx.config.timeout = config.performance.timeout;
  window.htmx.config.historyCacheSize = 0;
  window.htmx.config.withCredentials = false;

  // Handle export responses with rich notifications
  window.htmx.on('htmx:beforeSwap', function (event) {
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
  });

  // Handle other HTMX events
  window.htmx.on('htmx:afterSwap', function (event) {
    // Show modal if swapping modal content
    if (event.target.id === 'modal-container') {
      showModal();
    }
  });

  window.htmx.on('htmx:responseError', function (event) {
    try {
      const error = JSON.parse(event.detail.xhr.response);
      showNotification(error.error?.message || 'Request failed', 'error');
    } catch {
      showNotification('Request failed', 'error');
    }
  });

  window.htmx.on('htmx:timeout', () => {
    showNotification('Request timed out. Please try again.', 'error');
  });
}

// ============================================================================
// COMPONENT INITIALIZATION
// ============================================================================

// Initialize export buttons with dynamic URLs
function initializeExportButtons() {
  const exportButtons = document.querySelectorAll('.export-btn[data-action]');
  exportButtons.forEach((button) => {
    const action = button.dataset.action;
    if (action) {
      // Set up HTMX attributes (same approach as delete button)
      button.setAttribute('hx-post', getActionUrl(action));
      button.setAttribute('hx-target', '#export-result');
      button.setAttribute('hx-swap', 'innerHTML');
    }
  });

  // Process the buttons with HTMX after setting attributes
  if (window.htmx) {
    exportButtons.forEach((button) => {
      window.htmx.process(button);
    });
  }
}

// Refresh file list
function refreshFileList(callback) {
  const fileListElement = document.querySelector('.table-content');
  if (fileListElement && window.htmx) {
    // Add loading state with existing design system transitions
    fileListElement.classList.add('is-updating');

    window.htmx.ajax('GET', getActionUrl('browse-files'), {
      target: '.table-content',
      swap: 'innerHTML',
      indicator: false,
    });

    // Listen for the completion and trigger callback
    if (callback) {
      const handleUpdate = (event) => {
        // Only handle updates to our target
        if (event.detail.target === fileListElement) {
          // Remove loading state and call callback after brief delay for smooth transition
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

// Simple file browser initialization
function initializeFileBrowser() {
  // Load initial file list
  const fileListElement = document.querySelector('.table-content');
  if (fileListElement && window.htmx) {
    window.htmx.ajax('GET', getActionUrl('browse-files'), {
      target: '.table-content',
      swap: 'innerHTML',
      indicator: false, // No loading indicator for initial file list load
    });
  }

  // Handle delete button clicks
  document.addEventListener('click', function (e) {
    const deleteButton = e.target.closest('[data-action="delete"]');
    if (deleteButton) {
      e.preventDefault();
      const fileName = deleteButton.dataset.fileName;
      const filePath = deleteButton.dataset.filePath;
      if (fileName && filePath) {
        createDeleteModal(fileName, filePath);
      }
    }

    // Handle endpoints toggle clicks
    if (e.target.closest('.endpoints-toggle')) {
      toggleEndpoints(e.target.closest('.endpoints-toggle'));
    }
  });
}

// Create delete confirmation modal using template
function createDeleteModal(fileName, filePath) {
  const modalContainer = document.getElementById('modal-container');
  const template = document.getElementById('delete-modal-template');
  if (!modalContainer || !template) return;

  // Clone template content
  const content = template.content.cloneNode(true);

  // Populate template with data
  content.querySelector('.file-name').textContent = fileName;

  // Set up delete button
  const deleteButton = content.querySelector('.delete-confirm-btn');
  const deleteUrl = getActionUrl('delete-file', { fileName: filePath });

  deleteButton.setAttribute('hx-delete', deleteUrl);
  deleteButton.setAttribute('hx-target', '.table-content');
  deleteButton.setAttribute('hx-swap', 'innerHTML');
  deleteButton.setAttribute(
    'hx-on',
    `htmx:afterRequest: if(event.detail.successful) { hideModal(); showNotification('${fileName} deleted successfully', 'success'); }`
  );

  // Add close button handler
  const closeButton = content.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', hideModal);
  }

  // Replace modal content
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);

  // Process HTMX attributes and show modal
  if (window.htmx) {
    window.htmx.process(modalContainer);
  }

  showModal();
}

// Simple modal initialization
function initializeModal() {
  // Close modal when clicking backdrop
  document.querySelector('.modal-backdrop').addEventListener('click', function (e) {
    if (e.target === this) hideModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideModal();
  });
}

// Make functions globally available for HTMX handlers
window.hideModal = hideModal;
window.showNotification = showNotification;

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  try {
    // Immediately remove any loading states from body to prevent overlay
    document.body.classList.remove('is-loading', 'htmx-request');

    initializeHtmx();
    initializeExportButtons();
    initializeModal();
    initializeFileBrowser();
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
});
