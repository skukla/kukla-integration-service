/**
 * Download functionality handler
 * @module ui/downloads
 */

import { getActionUrl } from '../../core/url/index.js';
import { showNotification } from '../components/notifications/index.js';

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
 * Handle download button clicks to set up proper URLs
 * @param {Object} htmx - HTMX instance
 */
function setupDownloadClickHandler(htmx) {
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
}

/**
 * Process download response content
 * @param {string} responseContent - Response content
 * @param {string} fileName - File name
 * @param {string} contentType - Content type
 */
function processDownloadResponse(responseContent, fileName, contentType) {
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
}

/**
 * Handle successful download responses
 * @param {Event} event - HTMX after request event
 */
function handleDownloadSuccess(event) {
  const button = event.detail.elt;
  const fileName = button.dataset.fileName;

  try {
    // Get content type from response headers (use standard Content-Type header)
    let contentType = 'application/octet-stream'; // Default fallback

    try {
      // Try to get Content-Type header (browsers allow access to standard headers)
      contentType = event.detail.xhr.getResponseHeader('Content-Type') || contentType;
    } catch (headerError) {
      // If we can't access headers, use default content type
      console.warn('Could not access Content-Type header, using default:', headerError.message);
    }

    // Check if response is already base64 or plain text
    let responseContent = event.detail.xhr.response;

    // If the response doesn't look like base64, it might be raw content
    if (!responseContent || typeof responseContent !== 'string') {
      throw new Error('Invalid response format');
    }

    processDownloadResponse(responseContent, fileName, contentType);
    showNotification(`${fileName} downloaded successfully`, 'success');
  } catch (error) {
    showNotification(`Failed to process download for ${fileName}: ${error.message}`, 'error');
  }
}

/**
 * Handle download request completion
 * @param {Object} htmx - HTMX instance
 */
function setupDownloadResponseHandler(htmx) {
  htmx.on('htmx:afterRequest', (event) => {
    const button = event.detail.elt;
    if (!button.classList.contains('download-button')) return;

    const fileName = button.dataset.fileName;

    if (event.detail.successful) {
      handleDownloadSuccess(event);
    } else {
      const status = event.detail.xhr.status;
      const statusText = event.detail.xhr.statusText;
      showNotification(`Failed to download ${fileName} (${status}: ${statusText})`, 'error');
    }
  });
}

/**
 * Handle download errors
 * @param {Object} htmx - HTMX instance
 */
function setupDownloadErrorHandler(htmx) {
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

/**
 * Handle download with spinner - called by backend-generated onclick handlers
 * Uses timing-based approach for reliable UX feedback
 * @param {HTMLElement} button - Download button element
 * @param {string} fileName - File name being downloaded
 */
function handleDownloadWithSpinner(button, fileName) {
  // Show loading state immediately
  button.classList.add('is-loading');

  // Give the browser download a moment to start, then show success and remove spinner
  setTimeout(() => {
    button.classList.remove('is-loading');
    showNotification(`${fileName} downloaded successfully`, 'success');
  }, 800); // 800ms - quick feedback for immediate downloads
}

/**
 * Initialize HTMX download handlers
 * @param {Object} htmx - HTMX instance
 */
export function initializeDownloadHandlers(htmx) {
  setupDownloadClickHandler(htmx);
  setupDownloadResponseHandler(htmx);
  setupDownloadErrorHandler(htmx);

  // Make handleDownloadWithSpinner globally available for backend-generated onclick handlers
  window.handleDownloadWithSpinner = handleDownloadWithSpinner;
}
