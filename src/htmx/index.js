/**
 * HTMX Domain Catalog
 *
 * Provides access to HTMX-specific functionality including workflows
 * for UI generation and frontend interactions.
 */

module.exports = {
  workflows: {
    fileBrowser: require('./workflows/file-browser'),
  },
  utils: {
    formatting: require('./formatting'),
  },

  // Direct access to commonly used functions
  generateFileBrowserUI: require('./workflows/file-browser').generateFileBrowserUI,
  generateDeleteModal: require('./workflows/file-browser').generateDeleteModal,
  generateErrorResponse: require('./workflows/file-browser').generateErrorResponse,
};
