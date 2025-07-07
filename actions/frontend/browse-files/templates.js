/**
 * HTML templates for the browse-files action
 * @module browse-files/templates
 */

// Import template modules
const fileTemplates = require('./templates/file-templates');
const modalTemplates = require('./templates/modal-templates');
const uiComponents = require('./templates/ui-components');

// Re-export all template functions for backward compatibility
module.exports = {
  // UI Components
  getEmptyStateHtml: uiComponents.getEmptyStateHtml,
  getActionButtonsHtml: uiComponents.getActionButtonsHtml,
  getStorageIndicatorHtml: uiComponents.getStorageIndicatorHtml,

  // File Templates
  getFileRowHtml: fileTemplates.getFileRowHtml,
  getFileListHtml: fileTemplates.getFileListHtml,

  // Modal Templates
  getDeleteModalHtml: modalTemplates.getDeleteModalHtml,
};
