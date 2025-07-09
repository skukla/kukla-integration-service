/**
 * UI Domain Configuration
 * @module config/domains/ui
 *
 * Used by: Frontend components, user interface behavior
 * ⚙️ Key settings: Notifications, modals, timing, file browser UI configuration
 */

/**
 * Build UI configuration
 * @returns {Object} UI configuration
 */
function buildUiConfig() {
  return {
    notifications: {
      default: 5000,
      rich: 8000,
      success: 3000,
      error: 5000,
    },
    modal: {
      zIndex: 1000,
    },
    timing: {
      autoHide: {
        short: 3000,
        medium: 5000,
        long: 8000,
      },
      animation: {
        duration: 300,
      },
    },
    fileBrowser: {
      filterExtensions: ['.csv'],
      autoHideDelay: 3000,
    },
  };
}

module.exports = {
  buildUiConfig,
};
