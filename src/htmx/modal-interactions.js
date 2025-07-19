/**
 * HTMX Modal Interactions
 * Complete modal interaction capability with confirmation dialogs and dynamic content
 */

// All dependencies at top - external vs internal obvious from paths
const { listCsvFiles } = require('../files/file-browser');

// Business Workflows

/**
 * Complete delete confirmation modal workflow
 * @purpose Generate delete confirmation modal with file context and safety checks
 * @param {string} fileName - Name of file to delete
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} HTMX response with delete confirmation modal
 * @throws {Error} When modal generation fails or file context cannot be loaded
 * @usedBy delete-file action (confirmation step)
 * @config storage.provider, files.protectedPatterns
 */
async function generateDeleteConfirmationModal(fileName, config, params) {
  try {
    // Step 1: Validate file exists and get context
    const files = await listCsvFiles(config, params);
    const fileToDelete = files.find((f) => f.name === fileName || f.fullPath === fileName);

    // Step 2: Check if file is protected
    const isProtected = checkIfFileProtected(fileName, config);

    // Step 3: Generate appropriate modal content
    const modalHTML = generateDeleteModalHTML(fileName, fileToDelete, isProtected);

    // Step 4: Build modal response
    return buildModalResponse(modalHTML, { action: 'show' });
  } catch (error) {
    return generateModalErrorResponse('Failed to generate delete confirmation', error.message);
  }
}

/**
 * Process modal confirmation result
 * @purpose Handle user confirmation or cancellation from modal interactions
 * @param {string} action - User action ('confirm' or 'cancel')
 * @param {Object} modalData - Data passed from modal interaction
 * @returns {Object} HTMX response for modal result processing
 * @throws {Error} When action processing fails
 * @usedBy modal confirmation handlers
 */
async function processModalConfirmation(action, modalData) {
  try {
    if (action === 'confirm') {
      // Step 1: Return confirmation trigger for calling action
      return buildModalConfirmationResponse(modalData);
    } else {
      // Step 2: Close modal on cancellation
      return buildModalCancelResponse();
    }
  } catch (error) {
    return generateModalErrorResponse('Failed to process modal confirmation', error.message);
  }
}

/**
 * Generate generic information modal
 * @purpose Create informational modal for user messaging and guidance
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {Object} [options] - Modal display options
 * @returns {Object} HTMX response with information modal
 * @usedBy various actions for user guidance and information
 */
async function generateInformationModal(title, message, options = {}) {
  const modalHTML = generateInfoModalHTML(title, message, options);
  return buildModalResponse(modalHTML, { action: 'show' });
}

// Feature Operations

/**
 * Build modal response with HTMX triggers
 * @purpose Create standardized HTMX response for modal operations
 * @param {string} modalHTML - Complete modal HTML content
 * @param {Object} [options] - Modal response options
 * @returns {Object} HTMX modal response
 * @usedBy generateDeleteConfirmationModal, generateInformationModal
 */
function buildModalResponse(modalHTML, options = {}) {
  const { action = 'show', ...otherOptions } = options;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'HX-Trigger': action === 'show' ? 'show-modal' : 'hide-modal',
      ...otherOptions.headers,
    },
    body: modalHTML,
  };
}

/**
 * Build modal confirmation response
 * @purpose Create response for confirmed modal actions
 * @param {Object} modalData - Data from confirmed modal
 * @returns {Object} HTMX confirmation response
 * @usedBy processModalConfirmation
 */
function buildModalConfirmationResponse(modalData) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'HX-Trigger': JSON.stringify({
        'modal-confirmed': modalData,
        'hide-modal': true,
      }),
    },
    body: JSON.stringify({ confirmed: true, data: modalData }),
  };
}

/**
 * Build modal cancellation response
 * @purpose Create response for cancelled modal actions
 * @returns {Object} HTMX cancellation response
 * @usedBy processModalConfirmation
 */
function buildModalCancelResponse() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'HX-Trigger': JSON.stringify({
        'modal-cancelled': true,
        'hide-modal': true,
      }),
    },
    body: JSON.stringify({ cancelled: true }),
  };
}

// Feature Utilities

/**
 * Generate delete confirmation modal HTML
 * @purpose Create HTML for delete confirmation dialog with file information
 * @param {string} fileName - Name of file to delete
 * @param {Object} [fileInfo] - File metadata object
 * @param {boolean} [isProtected] - Whether file is protected
 * @returns {string} Complete modal HTML
 * @usedBy generateDeleteConfirmationModal
 */
function generateDeleteModalHTML(fileName, fileInfo = null, isProtected = false) {
  const fileSize = fileInfo?.size || 'Unknown size';
  const fileDate = fileInfo?.lastModified || 'Unknown date';

  const warningText = isProtected
    ? '<div class="modal-warning">⚠️ This file may be protected. Deletion may not be allowed.</div>'
    : '';

  return `
    <div class="modal-overlay" id="delete-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm File Deletion</h3>
          <button class="modal-close" onclick="cancelDelete()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this file? This action cannot be undone.</p>
          ${warningText}
          <div class="file-info">
            <div class="file-info-row">
              <strong>Name:</strong> <span class="file-name">${escapeHtml(fileName)}</span>
            </div>
            <div class="file-info-row">
              <strong>Size:</strong> <span class="file-size">${fileSize}</span>
            </div>
            <div class="file-info-row">
              <strong>Modified:</strong> <span class="file-date">${fileDate}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="cancelDelete()">Cancel</button>
          <button class="btn btn-danger" onclick="confirmDelete('${escapeHtml(fileName)}')"
                  ${isProtected ? 'title="File may be protected"' : ''}>
            Delete File
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate information modal HTML
 * @purpose Create HTML for informational modal dialogs
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {Object} [options] - Display options
 * @returns {string} Complete modal HTML
 * @usedBy generateInformationModal
 */
function generateInfoModalHTML(title, message, options = {}) {
  const { showCloseButton = true, type = 'info' } = options;

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const icon = iconMap[type] || iconMap.info;

  return `
    <div class="modal-overlay" id="info-modal">
      <div class="modal modal-${type}">
        <div class="modal-header">
          <h3>${icon} ${escapeHtml(title)}</h3>
          ${showCloseButton ? '<button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>' : ''}
        </div>
        <div class="modal-body">
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="closeModal()">OK</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Check if file is protected from deletion
 * @purpose Determine if file matches protection patterns
 * @param {string} fileName - Name of file to check
 * @param {Object} config - Configuration object with protection settings
 * @returns {boolean} True if file is protected
 * @usedBy generateDeleteConfirmationModal
 */
function checkIfFileProtected(fileName, config) {
  const protectedPatterns = config.files?.protectedPatterns || [];

  return protectedPatterns.some((pattern) => {
    try {
      return fileName.match(new RegExp(pattern));
    } catch (error) {
      // Invalid regex pattern - skip it
      return false;
    }
  });
}

/**
 * Generate modal error response
 * @purpose Create standardized error response for modal failures
 * @param {string} errorMessage - Primary error message
 * @param {string} [details] - Additional error details
 * @returns {Object} HTMX error response
 * @usedBy generateDeleteConfirmationModal, processModalConfirmation
 */
function generateModalErrorResponse(errorMessage, details = '') {
  const errorHTML = `
    <div class="modal-overlay" id="error-modal">
      <div class="modal modal-error">
        <div class="modal-header">
          <h3>❌ Error</h3>
          <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${escapeHtml(errorMessage)}</p>
          ${details ? `<p class="error-details">${escapeHtml(details)}</p>` : ''}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="closeModal()">OK</button>
        </div>
      </div>
    </div>
  `;

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'HX-Trigger': 'show-modal',
    },
    body: errorHTML,
  };
}

/**
 * Escape HTML characters for safe output
 * @purpose Prevent XSS by escaping HTML characters in user data
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 * @usedBy generateDeleteModalHTML, generateInfoModalHTML, generateModalErrorResponse
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

module.exports = {
  // Business workflows (main exports that actions import)
  generateDeleteConfirmationModal,
  processModalConfirmation,
  generateInformationModal,

  // Feature operations (coordination functions)
  buildModalResponse,
  buildModalConfirmationResponse,
  buildModalCancelResponse,

  // Feature utilities (building blocks)
  generateDeleteModalHTML,
  generateInfoModalHTML,
  checkIfFileProtected,
  generateModalErrorResponse,
  escapeHtml,
};
