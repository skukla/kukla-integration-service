/**
 * HTMX Modal Interactions
 * Complete modal interaction capability using HTML template files for cleaner maintainable UI
 */

// All dependencies at top - template loader and file validation
const { loadTemplateSync } = require('./shared/template-loader');

// Business Workflows

/**
 * Generate delete confirmation modal using HTML template
 * @purpose Create interactive delete confirmation modal for file operations
 * @param {string} fileName - Name of file to delete
 * @param {Object} config - Configuration object with file settings
 * @param {Object} params - Action parameters for file validation
 * @returns {Promise<Object>} HTMX response with delete confirmation modal
 * @usedBy delete-file action for confirmation workflow
 * @config files.protectedPatterns (for protected file detection)
 */
async function generateDeleteConfirmationModal(fileName, config, params) {
  try {
    // Step 1: Check if file is protected
    const isProtected = checkIfFileProtected(fileName, config);

    // Step 2: Get file metadata if available
    const fileInfo = await getFileInfoForModal(fileName, params);

    // Step 3: Generate modal HTML using template
    const modalHTML = generateDeleteModalHTML(fileName, fileInfo, isProtected);

    // Step 4: Return modal response
    return buildModalResponse(modalHTML);
  } catch (error) {
    return generateModalErrorResponse('Failed to generate delete confirmation', error.message);
  }
}

/**
 * Process modal confirmation actions
 * @purpose Handle modal confirmation responses and route to appropriate actions
 * @param {string} action - Modal action (confirm, cancel, dismiss)
 * @param {Object} data - Modal action data
 * @returns {Object} HTMX response for modal action
 * @usedBy Modal interaction handlers
 */
async function processModalConfirmation(action, data) {
  try {
    switch (action) {
      case 'confirm':
        return buildModalConfirmationResponse('confirmed', data);
      case 'cancel':
        return buildModalConfirmationResponse('cancelled', data);
      default:
        return buildModalConfirmationResponse('dismissed', data);
    }
  } catch (error) {
    return generateModalErrorResponse('Failed to process modal confirmation', error.message);
  }
}

/**
 * Generate information modal using HTML template
 * @purpose Create informational modal for user messaging
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {Object} [options] - Modal display options
 * @returns {Object} HTMX response with information modal
 * @usedBy Information display workflows
 * @config ui.modals (styling and behavior settings)
 */
async function generateInformationModal(title, message, options = {}) {
  try {
    const modalHTML = generateInfoModalHTML(title, message, options);
    return buildModalResponse(modalHTML);
  } catch (error) {
    return generateModalErrorResponse('Failed to generate information modal', error.message);
  }
}

// Feature Operations

/**
 * Build modal response with HTMX triggers
 * @purpose Create standardized HTMX response for modal operations
 * @param {string} modalHTML - Complete modal HTML content from template
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
 * @purpose Create standardized response for modal confirmation actions
 * @param {string} result - Confirmation result (confirmed, cancelled, dismissed)
 * @param {Object} data - Associated modal data
 * @returns {Object} HTMX confirmation response
 * @usedBy processModalConfirmation
 */
function buildModalConfirmationResponse(result, data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'HX-Trigger': JSON.stringify({
        'modal-confirmed': { result, data },
        'hide-modal': true,
      }),
    },
    body: JSON.stringify({ result, data }),
  };
}

// Feature Utilities

/**
 * Generate delete confirmation modal HTML using template
 * @purpose Create HTML for delete confirmation dialog using template file
 * @param {string} fileName - Name of file to delete
 * @param {Object} [fileInfo] - File metadata object
 * @param {boolean} [isProtected] - Whether file is protected
 * @returns {string} Complete modal HTML
 * @usedBy generateDeleteConfirmationModal
 */
function generateDeleteModalHTML(fileName, fileInfo = null, isProtected = false) {
  const variables = {
    fileName,
    fileSize: fileInfo ? fileInfo.size : 'Unknown size',
    fileDate: fileInfo ? fileInfo.lastModified : 'Unknown date',
    isProtected,
  };

  return loadTemplateSync('delete-modal', variables);
}

/**
 * Generate information modal HTML using inline template
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
 * @purpose Determine if file should be protected from deletion based on patterns
 * @param {string} fileName - Name of file to check
 * @param {Object} config - Configuration with protected patterns
 * @returns {boolean} Whether file is protected
 * @usedBy generateDeleteConfirmationModal
 */
function checkIfFileProtected(fileName, config) {
  const protectedPatterns = config.files.protectedPatterns;

  return protectedPatterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return fileName.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(fileName);
    }
    return false;
  });
}

/**
 * Get file information for modal display
 * @purpose Retrieve file metadata for modal display purposes
 * @param {string} fileName - File name to get info for
 * @param {Object} params - Action parameters
 * @returns {Promise<Object|null>} File info object or null
 * @usedBy generateDeleteConfirmationModal
 */
async function getFileInfoForModal(fileName, params) {
  try {
    // This would typically call a file info service
    // For now, return basic info based on fileName and params
    console.log(`Getting file info for ${fileName}`, params);
    return {
      size: 'Unknown size',
      lastModified: 'Unknown date',
    };
  } catch (error) {
    console.error(`Failed to get file info for ${fileName}:`, error);
    return null;
  }
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
 * @usedBy generateInfoModalHTML, generateModalErrorResponse
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

  // Feature utilities (building blocks)
  generateDeleteModalHTML,
  generateInfoModalHTML,
  checkIfFileProtected,
  getFileInfoForModal,
  generateModalErrorResponse,
  escapeHtml,
};
