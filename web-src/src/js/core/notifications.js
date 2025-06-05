/**
 * Notification System
 * @module core/notifications
 */

// Notification configuration
const NOTIFICATION_CONFIG = {
  CONTAINER_ID: 'notification-container',
  DEFAULT_DURATION: 5000,
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
  // Handle legacy format where options was just the type
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
  } = options;

  // Get or create notification container
  let container = document.getElementById(NOTIFICATION_CONFIG.CONTAINER_ID);
  if (!container) {
    container = createNotificationContainer();
    document.body.appendChild(container);
    // Add notification directly after container is added
    addNotificationToContainer(container, message, {
      type,
      duration,
      action,
      canRetry,
      onAction,
      onClose,
    });
    return;
  }

  // If container exists, add notification directly
  addNotificationToContainer(container, message, {
    type,
    duration,
    action,
    canRetry,
    onAction,
    onClose,
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

  // Set up removal if not an error with retry
  if (!(options.type === 'error' && options.canRetry)) {
    const timeout = setTimeout(() => {
      removeNotification(notification);
    }, options.duration);
    notification.dataset.timeout = timeout;
  }
}

/**
 * Create a notification element
 * @param {string} message - The message to display
 * @param {Object} options - Notification options
 * @returns {HTMLElement} The notification element
 */
function createNotificationElement(message, options) {
  const { type, action, canRetry, onAction, onClose } = options;

  const config = NOTIFICATION_CONFIG.TYPES[type] || NOTIFICATION_CONFIG.TYPES.info;
  const notification = document.createElement('div');

  notification.className = `notification ${config.className}`;
  notification.setAttribute('role', 'alert');

  // Create message container for proper text wrapping
  const messageContainer = document.createElement('div');
  messageContainer.className = 'notification-content';
  messageContainer.innerHTML = `
        <span class="notification-icon">${config.icon}</span>
        <span class="notification-message">${message}</span>
    `;

  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'notification-buttons';

  // Add action button if specified or if error with retry (but not both action and close)
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
    // Add close button only if no action button
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

  // Assemble notification
  notification.appendChild(messageContainer);
  notification.appendChild(buttonsContainer);

  // Add show class in the next frame to trigger animation
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
  // Clear any existing timeout
  const timeout = notification.dataset.timeout;
  if (timeout) {
    clearTimeout(Number(timeout));
  }

  // Animate out
  notification.classList.remove('show');
  notification.classList.add('hide');

  // Remove after animation
  setTimeout(() => {
    notification.remove();

    // Remove container if empty
    const container = document.getElementById(NOTIFICATION_CONFIG.CONTAINER_ID);
    if (container && !container.hasChildNodes()) {
      container.remove();
    }
  }, NOTIFICATION_CONFIG.ANIMATION_DURATION);
}

/**
 * Handle operation result and show appropriate notification
 * @param {Object} result - The operation result
 * @param {string} successMessage - Message to show on success
 */
export function handleDeleteResult(result, successMessage = 'Operation completed successfully') {
  if (result.error) {
    showNotification(result.error, 'error');
  } else {
    showNotification(successMessage, 'success');
  }
}
