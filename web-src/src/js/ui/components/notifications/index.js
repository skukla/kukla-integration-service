/**
 * Notification System
 * @module ui/components/notifications
 */

// Notification defaults - no config dependency needed
const NotificationDefaults = {
  DEFAULT_DURATION: 5000, // 5 seconds default
};

// Notification configuration
const NOTIFICATION_CONFIG = {
  CONTAINER_ID: 'notification-container',
  DEFAULT_DURATION: NotificationDefaults.DEFAULT_DURATION,
  ANIMATION_DURATION: 300,
  TYPES: {
    success: {
      icon: '✓',
      className: 'notification-success',
      defaultAction: 'Dismiss',
    },
    error: {
      icon: '✕',
      className: 'notification-error',
      defaultAction: 'Try Again',
    },
    warning: {
      icon: '⚠',
      className: 'notification-warning',
      defaultAction: 'Acknowledge',
    },
    info: {
      icon: 'ℹ',
      className: 'notification-info',
      defaultAction: 'OK',
    },
  },
};

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {Object|string} options - Notification options or type string
 * @param {string} [options.type='info'] - The type of notification
 * @param {number} [options.duration] - How long to show the notification
 * @param {string} [options.action] - Action button text
 * @param {boolean} [options.canRetry=false] - Whether the action can be retried
 * @param {Function} [options.onAction] - Action button callback
 * @param {Function} [options.onClose] - Close button callback
 */
export function showNotification(message, options = {}) {
  // Handle string shorthand for type
  if (typeof options === 'string') {
    options = { type: options };
  }

  const {
    type = 'info',
    duration = NOTIFICATION_CONFIG.DEFAULT_DURATION,
    action,
    canRetry = false,
    onAction,
    onClose,
    cssClass,
  } = options;

  // Get or create notification container
  let container = document.getElementById(NOTIFICATION_CONFIG.CONTAINER_ID);
  if (!container) {
    container = createNotificationContainer();
    document.body.appendChild(container);
    addNotificationToContainer(container, message, {
      type,
      duration,
      action,
      canRetry,
      onAction,
      onClose,
      cssClass,
    });
    return;
  }

  addNotificationToContainer(container, message, {
    type,
    duration,
    action,
    canRetry,
    onAction,
    onClose,
    cssClass,
  });
}

/**
 * Add a notification to the container
 * @param {HTMLElement} container - The notification container
 * @param {string} message - The message to display
 * @param {Object} options - Notification options
 */
function addNotificationToContainer(container, message, options) {
  const notification = createNotificationElement(message, options);
  container.appendChild(notification);

  // Make container visible when adding notifications
  container.style.display = 'flex';

  // Set up removal if not an error with retry
  if (!(options.type === 'error' && options.canRetry)) {
    let timeoutId;
    let removeDelayTimeout;
    
    // Function to start the timeout
    const startTimeout = () => {
      timeoutId = setTimeout(() => {
        removeNotification(notification);
      }, options.duration);
      notification.dataset.timeout = timeoutId;
    };
    
    // Function to pause the timeout
    const pauseTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (removeDelayTimeout) {
        clearTimeout(removeDelayTimeout);
      }
    };
    
    // Function to remove with a delay on mouse leave
    const removeWithDelay = () => {
      removeDelayTimeout = setTimeout(() => {
        removeNotification(notification);
      }, 500);
    };
    
    // Add hover event listeners
    notification.addEventListener('mouseenter', pauseTimeout);
    notification.addEventListener('mouseleave', removeWithDelay);
    
    // Start initial timeout
    startTimeout();
  }
}

/**
 * Create a notification element
 * @param {string} message - The message to display
 * @param {Object} options - Notification options
 * @returns {HTMLElement} The notification element
 */
function createNotificationElement(message, options) {
  const { type, action, canRetry, onAction, onClose, cssClass } = options;

  const config = NOTIFICATION_CONFIG.TYPES[type] || NOTIFICATION_CONFIG.TYPES.info;
  const notification = document.createElement('div');

  notification.className = `notification ${config.className}${cssClass ? ` ${cssClass}` : ''}`;
  notification.setAttribute('role', 'alert');

  const messageContainer = document.createElement('div');
  messageContainer.className = 'notification-content';
  messageContainer.innerHTML = `
    <span class="notification-icon">${config.icon}</span>
    <span class="notification-message">${message}</span>
  `;

  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'notification-buttons';

  if (action || (type === 'error' && canRetry)) {
    const actionButton = document.createElement('button');
    actionButton.className = 'notification-action';
    actionButton.textContent = action || config.defaultAction;
    actionButton.addEventListener('click', () => {
      if (onAction) {
        onAction();
      }
      removeNotification(notification);
    });
    buttonsContainer.appendChild(actionButton);
  } else {
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => {
      if (onClose) {
        onClose();
      }
      removeNotification(notification);
    });
    buttonsContainer.appendChild(closeButton);
  }

  notification.appendChild(messageContainer);
  notification.appendChild(buttonsContainer);

  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  return notification;
}

/**
 * Create the notification container
 * @returns {HTMLElement} The notification container
 */
function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = NOTIFICATION_CONFIG.CONTAINER_ID;
  container.className = 'notification-container';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  return container;
}

/**
 * Remove a notification element
 * @param {HTMLElement} notification - The notification to remove
 */
function removeNotification(notification) {
  const timeout = notification.dataset.timeout;
  if (timeout) {
    clearTimeout(Number(timeout));
  }

  notification.classList.remove('show');
  notification.classList.add('hide');

  setTimeout(() => {
    if (notification.parentNode) {
      const container = notification.parentNode;
      container.removeChild(notification);

      // Hide container if no more notifications
      if (container.children.length === 0) {
        container.style.display = 'none';
      }
    }
  }, NOTIFICATION_CONFIG.ANIMATION_DURATION);
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  const container = document.getElementById(NOTIFICATION_CONFIG.CONTAINER_ID);
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Handle success responses
 * @param {Object} result - Success result object
 * @param {string} successMessage - Success message to display
 */
export function handleSuccessResult(result, successMessage = 'Operation completed successfully') {
  if (result.message) {
    showNotification(result.message, 'success');
  } else {
    showNotification(successMessage, 'success');
  }
}

/**
 * Handle error responses
 * @param {Object} result - Error result object
 * @param {string} defaultMessage - Default error message
 */
export function handleErrorResult(result, defaultMessage = 'An error occurred') {
  const message = result.error?.message || result.message || defaultMessage;
  showNotification(message, {
    type: 'error',
    canRetry: result.error?.canRetry || false,
    onRetry: result.error?.onRetry,
  });
}

/**
 * Handle delete operation results
 * @param {Object} result - Delete operation result
 * @param {string} successMessage - Success message to display
 */
export function handleDeleteResult(result, successMessage = 'Operation completed successfully') {
  if (result.success) {
    handleSuccessResult(result, successMessage);
  } else {
    handleErrorResult(result, 'Delete operation failed');
  }
}
