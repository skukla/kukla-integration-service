/**
 * Download functionality handler
 * @module core/downloads
 */

import { showNotification } from './notifications.js';

/**
 * Process a base64 response and trigger file download
 * @param {string} base64Response - Base64 encoded file content
 * @param {string} fileName - Name of the file to download
 * @throws {Error} If processing fails
 */
export function processDownload(base64Response, fileName) {
    // Decode base64 to binary
    const binaryString = atob(base64Response);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create and download blob
    const blob = new Blob([bytes]);
    const url = window.URL.createObjectURL(blob);
    
    // Create and trigger download link
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Initialize HTMX download handlers
 * @param {Object} htmx - HTMX instance
 */
export function initializeDownloadHandlers(htmx) {
    // After request - Process download
    htmx.on('htmx:afterRequest', (event) => {
        const button = event.detail.elt;
        if (!button.classList.contains('download-button')) return;
        
        const fileName = button.dataset.fileName;

        if (event.detail.successful) {
            try {
                processDownload(event.detail.xhr.response, fileName);
                showNotification(`${fileName} downloaded successfully`, 'success');
            } catch (error) {
                showNotification(`Failed to process download for ${fileName}`, 'error');
            }
        } else {
            showNotification(`Failed to download ${fileName}`, 'error');
        }
    });

    // Error handling
    htmx.on('htmx:error', (event) => {
        const button = event.detail.elt;
        if (button.classList.contains('download-button')) {
            showNotification(`Failed to download ${button.dataset.fileName}: ${event.detail.error}`, 'error');
        }
    });
} 