/**
 * HTMX Notification System
 * Complete notification capability using HTML template files for cleaner maintainable UI
 */

// All dependencies at top - template loader and configuration
const { loadTemplateSync } = require('./shared/template-loader');

// Business Workflows

/**
 * Display success notification using HTML template
 * @purpose Show success notification with configurable message and duration
 * @param {string} message - Success message to display
 * @param {Object} [options] - Notification options
 * @returns {Object} HTMX response with success notification
 * @usedBy Actions and workflows for success feedback
 * @config ui.notifications (position, duration, sounds)
 */
async function showSuccessNotification(message, options = {}) {
  return showNotification(message, 'success', options);
}

/**
 * Display error notification using HTML template
 * @purpose Show error notification with configurable message and persistence
 * @param {string} message - Error message to display
 * @param {Object} [options] - Notification options
 * @returns {Object} HTMX response with error notification
 * @usedBy Error handling workflows
 * @config ui.notifications (position, duration, sounds)
 */
async function showErrorNotification(message, options = {}) {
  return showNotification(message, 'error', { duration: 8000, ...options });
}

/**
 * Display warning notification using HTML template
 * @purpose Show warning notification for important user awareness
 * @param {string} message - Warning message to display
 * @param {Object} [options] - Notification options
 * @returns {Object} HTMX response with warning notification
 * @usedBy Validation and warning workflows
 * @config ui.notifications (position, duration, sounds)
 */
async function showWarningNotification(message, options = {}) {
  return showNotification(message, 'warning', { duration: 6000, ...options });
}

/**
 * Display info notification using HTML template
 * @purpose Show informational notification for user guidance
 * @param {string} message - Info message to display
 * @param {Object} [options] - Notification options
 * @returns {Object} HTMX response with info notification
 * @usedBy Information and guidance workflows
 * @config ui.notifications (position, duration, sounds)
 */
async function showInfoNotification(message, options = {}) {
  return showNotification(message, 'info', { duration: 4000, ...options });
}

/**
 * Display progress notification with optional progress bar using HTML template
 * @purpose Show progress notification for long-running operations
 * @param {string} message - Progress message to display
 * @param {number|null} [progress] - Progress percentage (0-100) or null for indeterminate
 * @param {Object} [options] - Progress notification options
 * @returns {Object} HTMX response with progress notification
 * @usedBy Long-running operations for progress feedback
 * @config ui.notifications (position, duration)
 */
async function showProgressNotification(message, progress = null, options = {}) {
  const { persistent = true, actions = [] } = options;

  const variables = {
    message,
    notificationId: generateNotificationId(),
    progress: progress !== null ? Math.max(0, Math.min(100, progress)) : null,
    showProgress: true,
    indeterminate: progress === null,
    actions,
    showCloseButton: !persistent,
    autoHide: !persistent,
    duration: persistent ? 0 : 10000,
  };

  const notificationHTML = loadTemplateSync('progress-notification', variables);
  return buildNotificationResponse(notificationHTML, 'progress', {
    duration: variables.duration,
    persistent,
  });
}

// Feature Operations

/**
 * Core notification display using HTML template
 * @purpose Create notification using template file with configurable type and options
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {Object} [options] - Notification configuration options
 * @returns {Object} HTMX response with rendered notification
 * @usedBy All notification type functions
 */
function showNotification(message, type, options = {}) {
  const {
    duration = getDefaultDuration(type),
    actions = [],
    details = '',
    persistent = false,
  } = options;

  const variables = {
    message,
    type,
    notificationId: generateNotificationId(),
    icon: getNotificationIcon(type),
    details,
    actions,
    showCloseButton: true,
    autoHide: duration > 0,
    duration,
  };

  const notificationHTML = loadTemplateSync('notification', variables);
  return buildNotificationResponse(notificationHTML, type, { duration, persistent });
}

/**
 * Build notification response with HTMX triggers
 * @purpose Create standardized HTMX response for notification display
 * @param {string} notificationHTML - Complete notification HTML from template
 * @param {string} type - Notification type (success, error, warning, info, progress)
 * @param {Object} [options] - Response options
 * @returns {Object} HTMX notification response
 * @usedBy showNotification, showProgressNotification
 */
function buildNotificationResponse(notificationHTML, type, options = {}) {
  const { duration = 5000, persistent = false } = options;

  const triggerData = {
    'show-notification': {
      type,
      duration: persistent ? 0 : duration,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'HX-Trigger': JSON.stringify(triggerData),
    },
    body: notificationHTML,
  };
}

// Feature Utilities

/**
 * Generate unique notification ID
 * @purpose Create unique identifier for notification elements
 * @returns {string} Unique notification ID
 * @usedBy showNotification, showProgressNotification
 */
function generateNotificationId() {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get notification icon for type
 * @purpose Return appropriate icon for notification type
 * @param {string} type - Notification type
 * @returns {string} Icon for notification type
 * @usedBy showNotification
 */
function getNotificationIcon(type) {
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return iconMap[type] || iconMap.info;
}

/**
 * Get default duration for notification type
 * @purpose Return appropriate default duration for notification type
 * @param {string} type - Notification type
 * @returns {number} Default duration in milliseconds
 * @usedBy showNotification
 */
function getDefaultDuration(type) {
  const durationMap = {
    success: 5000,
    error: 8000,
    warning: 6000,
    info: 4000,
  };

  return durationMap[type] || 5000;
}

module.exports = {
  // Business workflows (main exports that actions import)
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  showProgressNotification,

  // Feature operations (coordination functions)
  showNotification,
  buildNotificationResponse,

  // Feature utilities (building blocks)
  generateNotificationId,
  getNotificationIcon,
  getDefaultDuration,
};
