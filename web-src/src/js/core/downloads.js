/**
 * Download functionality handler
 * @module core/downloads
 */

import { showNotification } from './notifications.js';
import { getActionUrl } from './url.js';

/**
 * Process a base64 response and trigger file download
 * @param {string} base64Response - Base64 encoded file content
 * @param {string} fileName - Name of the file to download
 * @param {string} contentType - MIME type of the file (optional)
 * @throws {Error} If processing fails
 */
export function processDownload(
  base64Response,
  fileName,
  contentType = 'application/octet-stream'
) {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Response);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create and download blob with proper content type
    const blob = new Blob([bytes], { type: contentType });
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
  } catch (error) {
    throw new Error(`Failed to process download: ${error.message}`);
  }
}

/**
 * Build download URL using the configured action URL builder
 * @param {string} fileName - File name/path to download
 * @returns {string} Download URL
 */
function buildDownloadUrl(fileName) {
  return getActionUrl('download-file', { fileName });
}

/**
 * Initialize HTMX download handlers
 * @param {Object} htmx - HTMX instance
 */
export function initializeDownloadHandlers(htmx) {
  // Set up download URLs on click
  document.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('.download-button');
      if (!button) return;

      const filePath = button.dataset.filePath;
      if (filePath) {
        // Generate the correct URL and update the hx-get attribute
        const downloadUrl = buildDownloadUrl(filePath);
        button.setAttribute('hx-get', downloadUrl);

        // Process the element again with the new URL
        htmx.process(button);
      }
    },
    true
  ); // Use capture to run before HTMX's click handler

  // After request - Process download
  htmx.on('htmx:afterRequest', (event) => {
    const button = event.detail.elt;
    if (!button.classList.contains('download-button')) return;

    const fileName = button.dataset.fileName;

    if (event.detail.successful) {
      try {
        // Get content type from response headers
        const contentType =
          event.detail.xhr.getResponseHeader('X-File-Type') || 'application/octet-stream';

        // Check if response is already base64 or plain text
        let responseContent = event.detail.xhr.response;

        // If the response doesn't look like base64, it might be raw content
        if (!responseContent || typeof responseContent !== 'string') {
          throw new Error('Invalid response format');
        }

        // Detect if content is base64 or plain text
        const isBase64 =
          /^[A-Za-z0-9+/]*={0,2}$/.test(responseContent) && responseContent.length % 4 === 0;

        if (isBase64) {
          processDownload(responseContent, fileName, contentType);
        } else {
          // Convert plain text to blob and download directly
          const blob = new Blob([responseContent], { type: contentType });
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();

          // Clean up
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        showNotification(`${fileName} downloaded successfully`, 'success');
      } catch (error) {
        showNotification(`Failed to process download for ${fileName}: ${error.message}`, 'error');
      }
    } else {
      const status = event.detail.xhr.status;
      const statusText = event.detail.xhr.statusText;
      showNotification(`Failed to download ${fileName} (${status}: ${statusText})`, 'error');
    }
  });

  // Error handling
  htmx.on('htmx:error', (event) => {
    const button = event.detail.elt;
    if (button.classList.contains('download-button')) {
      showNotification(
        `Failed to download ${button.dataset.fileName}: ${event.detail.error}`,
        'error'
      );
    }
  });
}
