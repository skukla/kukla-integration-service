/**
 * HTMX Notification System
 * Complete notification capability with success, error, warning, and info messages
 */

// Business Workflows

/**
 * Display success notification with optional auto-hide
 * @purpose Show success message to user with customizable display options
 * @param {string} message - Success message to display
 * @param {Object} [options] - Notification display options
 * @returns {Object} HTMX response with success notification
 * @throws {Error} When notification generation fails
 * @usedBy file operations, product exports, successful actions
 * @config ui.notifications.duration, ui.notifications.position
 */
async function showSuccessNotification(message, options = {}) {
  const { duration = 5000, persistent = false, actions = [] } = options;

  const notificationHTML = generateNotificationHTML(message, 'success', {
    duration: persistent ? 0 : duration,
    actions,
  });

  return buildNotificationResponse(notificationHTML, 'success', { duration });
}

/**
 * Display error notification with persistent display
 * @purpose Show error message to user with enhanced visibility and optional retry actions
 * @param {string} message - Error message to display
 * @param {Object} [options] - Error notification options
 * @returns {Object} HTMX response with error notification
 * @throws {Error} When notification generation fails
 * @usedBy failed operations, validation errors, API failures
 * @config ui.notifications.errorDuration, ui.notifications.position
 */
async function showErrorNotification(message, options = {}) {
  const { duration = 8000, persistent = false, actions = [], details = '' } = options;

  const notificationHTML = generateNotificationHTML(message, 'error', {
    duration: persistent ? 0 : duration,
    actions,
    details,
  });

  return buildNotificationResponse(notificationHTML, 'error', { duration, persistent });
}

/**
 * Display warning notification with medium priority
 * @purpose Show warning message to user for important but non-critical information
 * @param {string} message - Warning message to display
 * @param {Object} [options] - Warning notification options
 * @returns {Object} HTMX response with warning notification
 * @throws {Error} When notification generation fails
 * @usedBy validation warnings, deprecation notices, configuration issues
 * @config ui.notifications.warningDuration, ui.notifications.position
 */
async function showWarningNotification(message, options = {}) {
  const { duration = 6000, persistent = false, actions = [] } = options;

  const notificationHTML = generateNotificationHTML(message, 'warning', {
    duration: persistent ? 0 : duration,
    actions,
  });

  return buildNotificationResponse(notificationHTML, 'warning', { duration });
}

/**
 * Display info notification with standard display
 * @purpose Show informational message to user for general guidance
 * @param {string} message - Info message to display
 * @param {Object} [options] - Info notification options
 * @returns {Object} HTMX response with info notification
 * @throws {Error} When notification generation fails
 * @usedBy help messages, status updates, general information
 * @config ui.notifications.infoDuration, ui.notifications.position
 */
async function showInfoNotification(message, options = {}) {
  const { duration = 4000, persistent = false, actions = [] } = options;

  const notificationHTML = generateNotificationHTML(message, 'info', {
    duration: persistent ? 0 : duration,
    actions,
  });

  return buildNotificationResponse(notificationHTML, 'info', { duration });
}

/**
 * Display progress notification for long-running operations
 * @purpose Show progress message with optional progress bar for lengthy operations
 * @param {string} message - Progress message to display
 * @param {Object} [options] - Progress notification options
 * @returns {Object} HTMX response with progress notification
 * @throws {Error} When notification generation fails
 * @usedBy file uploads, product exports, bulk operations
 * @config ui.notifications.progressDuration, ui.notifications.position
 */
async function showProgressNotification(message, options = {}) {
  const { progress = null, persistent = true, actions = [] } = options;

  const notificationHTML = generateProgressNotificationHTML(message, progress, {
    persistent,
    actions,
  });

  return buildNotificationResponse(notificationHTML, 'progress', { persistent: true });
}

// Feature Operations

/**
 * Build notification response with HTMX triggers
 * @purpose Create standardized HTMX response for notification display
 * @param {string} notificationHTML - Complete notification HTML
 * @param {string} type - Notification type (success, error, warning, info, progress)
 * @param {Object} [options] - Response options
 * @returns {Object} HTMX notification response
 * @usedBy all notification workflows
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

/**
 * Build notification trigger response without HTML
 * @purpose Create HTMX trigger response for client-side notification handling
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {Object} [options] - Trigger options
 * @returns {Object} HTMX trigger response
 * @usedBy actions that want to trigger notifications without HTML content
 */
function buildNotificationTriggerResponse(message, type, options = {}) {
  const { duration = 5000, persistent = false } = options;

  const triggerData = {
    'show-notification': {
      message,
      type,
      duration: persistent ? 0 : duration,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'HX-Trigger': JSON.stringify(triggerData),
    },
    body: JSON.stringify({ notificationSent: true }),
  };
}

// Feature Utilities

/**
 * Generate notification HTML with type-specific styling
 * @purpose Create HTML for notification display with appropriate styling and actions
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {Object} [options] - HTML generation options
 * @returns {string} Complete notification HTML
 * @usedBy showSuccessNotification, showErrorNotification, showWarningNotification, showInfoNotification
 */
function generateNotificationHTML(message, type, options = {}) {
  const { duration = 5000, actions = [], details = '' } = options;

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const icon = iconMap[type] || iconMap.info;
  const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const actionsHTML =
    actions.length > 0
      ? `<div class="notification-actions">
         ${actions
           .map(
             (action) =>
               `<button class="btn btn-sm btn-outline" onclick="${action.onClick}">${action.label}</button>`
           )
           .join('')}
       </div>`
      : '';

  const detailsHTML = details
    ? `<div class="notification-details">${escapeHtml(details)}</div>`
    : '';

  const autoHideData = duration > 0 ? `data-auto-hide="${duration}"` : '';

  return `
    <div class="notification notification-${type}" 
         id="${notificationId}" 
         ${autoHideData}
         role="alert"
         aria-live="polite">
      <div class="notification-content">
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">
          <div class="notification-text">${escapeHtml(message)}</div>
          ${detailsHTML}
          ${actionsHTML}
        </div>
        <button class="notification-close" 
                onclick="closeNotification('${notificationId}')"
                aria-label="Close notification">
          &times;
        </button>
      </div>
    </div>
  `;
}

/**
 * Generate progress notification HTML with progress bar
 * @purpose Create HTML for progress notification with optional progress indication
 * @param {string} message - Progress message
 * @param {number|null} progress - Progress percentage (0-100) or null for indeterminate
 * @param {Object} [options] - Progress options
 * @returns {string} Complete progress notification HTML
 * @usedBy showProgressNotification
 */
function generateProgressNotificationHTML(message, progress = null, options = {}) {
  const { persistent = true, actions = [] } = options;

  const notificationId = `progress-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const progressBarHTML =
    progress !== null
      ? `<div class="progress-bar">
         <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, progress))}%"></div>
         <div class="progress-text">${Math.round(progress)}%</div>
       </div>`
      : `<div class="progress-bar progress-indeterminate">
         <div class="progress-fill"></div>
       </div>`;

  const actionsHTML =
    actions.length > 0
      ? `<div class="notification-actions">
         ${actions
           .map(
             (action) =>
               `<button class="btn btn-sm btn-outline" onclick="${action.onClick}">${action.label}</button>`
           )
           .join('')}
       </div>`
      : '';

  return `
    <div class="notification notification-progress" 
         id="${notificationId}" 
         ${persistent ? '' : 'data-auto-hide="10000"'}
         role="status"
         aria-live="polite">
      <div class="notification-content">
        <div class="notification-icon">🔄</div>
        <div class="notification-message">
          <div class="notification-text">${escapeHtml(message)}</div>
          ${progressBarHTML}
          ${actionsHTML}
        </div>
        ${
          persistent
            ? ''
            : `<button class="notification-close" 
                                      onclick="closeNotification('${notificationId}')"
                                      aria-label="Close notification">
                                &times;
                              </button>`
        }
      </div>
    </div>
  `;
}

/**
 * Generate notification container HTML for initial page setup
 * @purpose Create HTML container for notification display system
 * @param {Object} [options] - Container options
 * @returns {string} Notification container HTML
 * @usedBy page initialization, layout setup
 */
function generateNotificationContainerHTML(options = {}) {
  const { position = 'top-right', maxNotifications = 5 } = options;

  return `
    <div id="notification-container" 
         class="notification-container notification-container-${position}"
         data-max-notifications="${maxNotifications}"
         role="region"
         aria-label="Notifications">
    </div>
  `;
}

/**
 * Escape HTML characters for safe output
 * @purpose Prevent XSS by escaping HTML characters in user data
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 * @usedBy generateNotificationHTML, generateProgressNotificationHTML
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get notification configuration from system config
 * @purpose Extract notification settings for consistent behavior
 * @param {Object} config - System configuration object
 * @returns {Object} Notification configuration
 * @usedBy all notification workflows for configuration-driven behavior
 */
function getNotificationConfig(config) {
  return {
    position: config.ui?.notifications?.position || 'top-right',
    duration: {
      success: config.ui?.notifications?.successDuration || 5000,
      error: config.ui?.notifications?.errorDuration || 8000,
      warning: config.ui?.notifications?.warningDuration || 6000,
      info: config.ui?.notifications?.infoDuration || 4000,
      progress: config.ui?.notifications?.progressDuration || 0,
    },
    maxNotifications: config.ui?.notifications?.maxNotifications || 5,
    sounds: config.ui?.notifications?.sounds || false,
  };
}

module.exports = {
  // Business workflows (main exports that actions import)
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  showProgressNotification,

  // Feature operations (coordination functions)
  buildNotificationResponse,
  buildNotificationTriggerResponse,

  // Feature utilities (building blocks)
  generateNotificationHTML,
  generateProgressNotificationHTML,
  generateNotificationContainerHTML,
  getNotificationConfig,
  escapeHtml,
};
