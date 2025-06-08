/**
 * File Browser Component
 * @module ui/file-browser
 */

import { getActionUrl } from '../../core/url/index.js';
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

  container.addEventListener('dragleave', () => {
    container.classList.remove(FILE_BROWSER_CONFIG.DRAG_ACTIVE_CLASS);
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove(FILE_BROWSER_CONFIG.DRAG_ACTIVE_CLASS);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  });
}

/**
 * Initialize upload form handler
 */
function initializeUploadForm() {
  const uploadForm = document.getElementById(FILE_BROWSER_CONFIG.UPLOAD_FORM_ID);
  if (!uploadForm) return;

  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = uploadForm.querySelector('input[type="file"]');
    if (fileInput && fileInput.files.length > 0) {
      handleFileUpload(Array.from(fileInput.files));
    }
  });
}

/**
 * Handle file upload
 * @param {File[]} files - Array of files to upload
 */
async function handleFileUpload(files) {
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(getActionUrl('upload-file'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      showNotification(`${file.name} uploaded successfully`, 'success');
      document.body.dispatchEvent(new Event('fileUploaded'));
    } catch (error) {
      showNotification(`Failed to upload ${file.name}: ${error.message}`, 'error');
    }
  }
}

/**
 * Initialize event handlers for delete buttons and modal actions
 */
function initializeDeleteHandlers() {
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="delete"]');
    if (target) {
      event.preventDefault();
      handleDeleteButtonClick(target);
    }

    const deleteConfirmButton = event.target.closest('[data-delete-url]');
    if (deleteConfirmButton) {
      event.preventDefault();
      handleDeleteConfirmation(deleteConfirmButton);
    }

    const modalCloseButton = event.target.closest('.modal-close');
    if (modalCloseButton) {
      event.preventDefault();
      hideModal();
    }
  });
}

/**
 * Handle delete button click - creates modal instantly
 * @param {HTMLElement} button - The delete button element
 */
function handleDeleteButtonClick(button) {
  const fileName = button.getAttribute('data-file-name');
  const filePath = button.getAttribute('data-file-path');

  if (!fileName || !filePath) {
    return;
  }

  createDeleteModal(fileName, filePath);
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

  const deleteUrl = getActionUrl('delete-file', { fileName: filePath });

  modalContainer.innerHTML = `
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
                        hx-delete="${deleteUrl}"
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
 * Handle delete confirmation button click
 * @param {HTMLElement} button - The delete confirmation button
 */
async function handleDeleteConfirmation(button) {
  const deleteUrl = button.getAttribute('data-delete-url');
  const fileName = button.getAttribute('data-file-name');

  if (!deleteUrl) {
    return;
  }

  button.classList.add('is-loading');
  button.disabled = true;

  try {
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    showNotification(`File ${fileName} deleted successfully`, 'success');
    hideModal();
    document.body.dispatchEvent(new Event('fileDeleted'));
  } catch (error) {
    showNotification(`Failed to delete ${fileName}: ${error.message}`, 'error');
  } finally {
    button.classList.remove('is-loading');
    button.disabled = false;
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
    refreshFileList();
  } else {
    const message = result.error?.message || `File ${operation} failed`;
    showNotification(message, 'error');
  }
}
