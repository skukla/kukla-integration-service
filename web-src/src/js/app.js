/**
 * Application initialization and business logic
 * Extracted from main.js for better organization
 */

import { showModal, hideModal, initializeModal } from './ui/components/modal/index.js';
import { showNotification } from './ui/components/notifications/index.js';
import { initializeFileBrowser } from './ui/file-browser/index.js';
import { getActionUrl } from './utils.js';

// ============================================================================
// COMPONENT INITIALIZATION
// ============================================================================

/**
 * Initialize export buttons with dynamic URLs
 * Now uses declarative HTMX attributes in HTML, just updates URLs
 */
export function initializeExportButtons() {
  const exportButtons = document.querySelectorAll('.export-btn[data-action]');
  exportButtons.forEach((button) => {
    const action = button.dataset.action;
    if (action) {
      // Update the hx-post attribute with the correct dynamic URL
      const actionUrl = getActionUrl(action);
      button.setAttribute('hx-post', actionUrl);
    }
  });

  // Process the buttons with HTMX after URL updates
  if (window.htmx) {
    exportButtons.forEach((button) => {
      window.htmx.process(button);
    });
  }
}

/**
 * Create delete confirmation modal using template
 * Now uses declarative HTMX attributes in HTML, just updates URLs and handlers
 * @param {string} fileName - File name to display
 * @param {string} filePath - File path for deletion
 */
export function createDeleteModal(fileName, filePath) {
  const modalContainer = document.getElementById('modal-container');
  const template = document.getElementById('delete-modal-template');
  if (!modalContainer || !template) return;

  // Clone template content
  const content = template.content.cloneNode(true);

  // Populate template with data
  content.querySelector('.file-name').textContent = fileName;

  // Set up delete button with correct URL and success handler
  const deleteButton = content.querySelector('.delete-confirm-btn');
  const deleteUrl = getActionUrl('delete-file', { fileName: filePath });

  deleteButton.setAttribute('hx-delete', deleteUrl);
  deleteButton.classList.add('delete-confirm-button'); // For event handler identification
  deleteButton.setAttribute('data-file-name', fileName); // For notification
  // Delete success handling moved to setupDeleteModalHandlers() in htmx.js

  // Close button now uses hx-on="click: hideModal()" in HTML template

  // Replace modal content
  modalContainer.innerHTML = '';
  modalContainer.appendChild(content);

  // Process HTMX attributes and show modal
  if (window.htmx) {
    window.htmx.process(modalContainer);
  }

  showModal();
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initialize the complete application
 * Main entry point for app startup
 */
export function initializeApp() {
  try {
    // Immediately remove any loading states from body to prevent overlay
    document.body.classList.remove('is-loading', 'htmx-request');

    // Initialize all components
    initializeExportButtons();
    initializeModal();
    initializeFileBrowser();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    showNotification('Application initialization failed', 'error');
  }
}

// Make functions globally available for HTMX handlers and external use
window.hideModal = hideModal;
window.showNotification = showNotification;
window.createDeleteModal = createDeleteModal;
