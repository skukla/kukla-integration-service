/**
 * File Browser Component
 * @module browser/file-browser
 */

import { getActionUrl } from '../core/urls.js';
import { showNotification } from '../core/notifications.js';
import { createModal } from '../core/modal.js';

// File browser configuration
const FILE_BROWSER_CONFIG = {
    CONTAINER_ID: 'file-browser',
    FILE_LIST_CLASS: 'table-content',
    UPLOAD_FORM_ID: 'upload-form',
    DRAG_ACTIVE_CLASS: 'drag-active'
};

/**
 * Initialize the file browser component
 */
export function initializeFileBrowser() {
    const container = document.getElementById(FILE_BROWSER_CONFIG.CONTAINER_ID);
    if (!container) return;

    // Initialize drag and drop
    initializeDragAndDrop(container);

    // Initialize upload form
    initializeUploadForm();
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
 * Initialize the upload form
 */
function initializeUploadForm() {
    const form = document.getElementById(FILE_BROWSER_CONFIG.UPLOAD_FORM_ID);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = form.querySelector('input[type="file"]');
        const files = Array.from(fileInput.files);
        if (files.length > 0) {
            await handleFileUpload(files);
            form.reset();
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
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            showNotification(`${file.name} uploaded successfully`, 'success');
            
            // Trigger file list refresh
            document.body.dispatchEvent(new Event('fileUploaded'));

        } catch (error) {
            showNotification(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
    }
}

/**
 * Show delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 */
function confirmDelete(fileName) {
    createModal({
        title: 'Confirm Delete',
        content: `Are you sure you want to delete ${fileName}?`,
        onConfirm: () => deleteFile(fileName),
        onCancel: () => {}
    });
}

/**
 * Delete a file
 * @param {string} fileName - Name of the file to delete
 */
async function deleteFile(fileName) {
    try {
        const response = await fetch(getActionUrl('delete-file', { fileName }), {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.statusText}`);
        }

        showNotification(`${fileName} deleted successfully`, 'success');
        
        // Trigger file list refresh
        document.body.dispatchEvent(new Event('fileDeleted'));

    } catch (error) {
        showNotification(`Failed to delete ${fileName}: ${error.message}`, 'error');
    }
}