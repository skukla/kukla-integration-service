/**
 * File Browser Component
 * @module ui/file-browser
 */

import { getActionUrl } from '../../core/url/index.js';
import { clearInitialPageSetup } from '../../htmx/events.js';
import { showModal, hideModal } from '../components/modal/index.js';
import { showNotification } from '../components/notifications/index.js';

// File browser configuration
const FILE_BROWSER_CONFIG = {
  CONTAINER_CLASS: 'file-browser',
  FILE_LIST_CLASS: 'table-content',
  UPLOAD_FORM_ID: 'upload-form',
  DRAG_ACTIVE_CLASS: 'drag-active',
};

/**
 * Initialize the file browser component
 */
export function initializeFileBrowser() {
  const container = document.querySelector(`.${FILE_BROWSER_CONFIG.CONTAINER_CLASS}`);
  if (!container) {
    return;
  }

  initializeDragAndDrop(container);
  initializeUploadForm();
  initializeDeleteHandlers();

  // Manually load initial file list (without loading overlays)
  const fileListElement = document.querySelector('.table-content[data-component="file-list"]');
  if (fileListElement && window.htmx) {
    // Use HTMX to load the initial file list
    window.htmx
      .ajax('GET', getActionUrl('browse-files'), {
        target: '.table-content',
        swap: 'innerHTML',
      })
      .then(() => {
        // Clear the initial page setup flag to enable loading states for user actions
        clearInitialPageSetup();
        return undefined;
      })
      .catch((error) => {
        // Clear the initial page setup flag even if load fails
        clearInitialPageSetup();
        console.warn('Initial file list load failed:', error);
      });
  } else {
    // If no file list element or HTMX, still clear the flag
    clearInitialPageSetup();
  }
}

/**
 * Initialize drag and drop functionality
 * @param {HTMLElement} container - The file browser container
 */
function initializeDragAndDrop(container) {
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add(FILE_BROWSER_CONFIG.DRAG_ACTIVE_CLASS);
  });

  container.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || !container.contains(e.relatedTarget)) {
      container.classList.remove(FILE_BROWSER_CONFIG.DRAG_ACTIVE_CLASS);
    }
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove(FILE_BROWSER_CONFIG.DRAG_ACTIVE_CLASS);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
}

/**
 * Initialize upload form
 */
function initializeUploadForm() {
  const uploadForm = document.getElementById(FILE_BROWSER_CONFIG.UPLOAD_FORM_ID);
  if (!uploadForm) {
    return;
  }

  const fileInput = uploadForm.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }
}

/**
 * Handle file upload
 * @param {File} file - File to upload
 */
function handleFileUpload(file) {
  // Validate file type
  if (!file.name.endsWith('.csv')) {
    showNotification('Only CSV files are allowed', 'error');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  // Upload the file using fetch
  fetch(getActionUrl('upload-file'), {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((result) => {
      handleFileOperationResult(result, 'upload');
      if (result.success) {
        refreshFileList();
      }
      return result;
    })
    .catch((error) => {
      showNotification(`Upload failed: ${error.message}`, 'error');
    });
}

/**
 * Initialize delete handlers
 */
function initializeDeleteHandlers() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="delete"]')) {
      e.preventDefault();
      const fileName = e.target.dataset.fileName;
      const filePath = e.target.dataset.filePath;
      if (fileName && filePath) {
        createDeleteModal(fileName, filePath);
      }
    }
  });
}

/**
 * Generate modal content HTML
 * @param {string} fileName - Name of the file
 * @param {string} filePath - Full path of the file
 * @returns {string} Modal HTML content
 */
function generateModalContent(fileName, filePath) {
  const deleteUrl = getActionUrl('delete-file', { fileName: filePath });

  return `
    <div class="modal-content">
        <h2>Delete File</h2>
        <div class="modal-body">
            <p>Are you sure you want to delete "${fileName}"?</p>
            <p class="modal-warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
            <div class="btn-group">
                <button type="button"
                        class="btn btn-secondary modal-close"
                        aria-label="Cancel deletion">
                    <span class="btn-label">Cancel</span>
                </button>
                <button type="button"
                        class="btn btn-danger btn-outline delete-confirm-button"
                        data-loading-class="is-loading"
                        data-success-message="File deleted successfully"
                        data-file-name="${fileName}"
                        hx-post="${deleteUrl}"
                        hx-target=".table-content"
                        hx-swap="innerHTML"
                        hx-trigger="click"
                        aria-label="Confirm deletion of ${fileName}">
                    <span class="btn-label">Delete</span>
                </button>
            </div>
        </div>
    </div>
  `;
}

/**
 * Create and show delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} filePath - Full path of the file
 */
function createDeleteModal(fileName, filePath) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) {
    return;
  }

  modalContainer.innerHTML = generateModalContent(fileName, filePath);

  const closeButton = modalContainer.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      hideModal();
    });
  }

  showModal();

  // Tell HTMX to process the new modal content
  if (window.htmx) {
    window.htmx.process(modalContainer);
  }
}

/**
 * Refresh the file list
 */
export function refreshFileList() {
  const fileList = document.querySelector(`.${FILE_BROWSER_CONFIG.FILE_LIST_CLASS}`);
  if (fileList) {
    document.body.dispatchEvent(new Event('refreshFileList'));
  }
}

/**
 * Handle file operations results
 * @param {Object} result - Operation result
 * @param {string} operation - Operation type (upload, delete, etc.)
 */
export function handleFileOperationResult(result, operation = 'operation') {
  if (result.success) {
    showNotification(`File ${operation} completed successfully`, 'success');
  } else {
    const message = result.error?.message || `File ${operation} failed`;
    showNotification(message, 'error');
  }
}
