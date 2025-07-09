/**
 * UI Domain Configuration
 * @module config/domains/ui
 *
 * 🎯 Used by: Frontend components, user interface behavior
 * ⚙️ Key settings: Notifications, modals, timing, file browser UI, technical UI configuration
 */

/**
 * Build UI configuration
 * @param {Object} [params] - Action parameters (unused - kept for interface consistency)
 * @param {Object} [mainConfig] - Shared main configuration (for future shared settings)
 * @returns {Object} UI configuration
 */
function buildUiConfig(params = {}, mainConfig = {}) {
  // Note: both parameters available for future shared settings
  // eslint-disable-next-line no-unused-vars
  params;
  // eslint-disable-next-line no-unused-vars
  mainConfig;

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
