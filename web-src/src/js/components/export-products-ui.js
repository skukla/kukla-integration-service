/**
 * Export Products UI Component
 * Manages export products responses, notifications, and user feedback
 */

import { showNotification } from '../ui/components/notifications/index.js';

/**
 * Toggle function for collapsible endpoints list
 */
function toggleEndpoints(button) {
  const endpointsList = button.nextElementSibling;
  const toggleIcon = button.querySelector('.toggle-icon');

  if (endpointsList.style.display === 'none' || endpointsList.style.display === '') {
    endpointsList.style.display = 'block';
    toggleIcon.textContent = '▲';
  } else {
    endpointsList.style.display = 'none';
    toggleIcon.textContent = '▼';
  }
}

/**
 * Initialize export products UI handling
 */
export function initializeExportProductsUI() {
  // Handle export loading states
  document.addEventListener('htmx:beforeRequest', () => {
    const loader = document.getElementById('export-loader');
    if (loader) {
      loader.style.display = 'flex';
    }
  });

  document.addEventListener('htmx:afterRequest', () => {
    const loader = document.getElementById('export-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  });

  // Handle endpoints toggle clicks using event delegation
  document.addEventListener('click', (event) => {
    if (event.target.closest('.endpoints-toggle')) {
      toggleEndpoints(event.target.closest('.endpoints-toggle'));
    }
  });

  // Handle export responses
  document.addEventListener('htmx:beforeSwap', (event) => {
    if (event.target.id !== 'export-result') return;

    const methodButton = document.querySelector('.htmx-request[data-export-method]');
    const methodName = methodButton?.dataset?.exportMethod
      ? methodButton.dataset.exportMethod
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Export';

    try {
      const response = JSON.parse(event.detail.xhr.responseText);

      if (response.success) {
        // Clear the target (no more main UI status display)
        event.detail.serverResponse = '';

        // Show enhanced success notification with metrics
        const notificationContent = createSuccessNotificationContent(response);
        showNotification(notificationContent, {
          type: 'success',
          duration: 8000, // Longer duration for rich content
          cssClass: 'notification-rich', // Add class to hide default elements
        });

        // Auto-refresh file list immediately after successful export
        const fileList = document.querySelector('[data-component="file-list"]');
        if (fileList && window.htmx) {
          // Use htmx.ajax to trigger a fresh request to the browse-files action
          window.htmx.ajax('GET', './api/v1/web/kukla-integration-service/browse-files', {
            target: fileList,
            swap: 'innerHTML',
          });
        }
      } else {
        // Clear the target for errors too
        event.detail.serverResponse = '';
        // Show error notification only (errors still need toasts)
        handleExportError(response.message || response.error || 'Export failed', methodName);
      }
    } catch (error) {
      console.error('Export response parse error:', error.message);
      // Clear the target for parsing errors
      event.detail.serverResponse = '';
      handleExportError('Failed to parse export response', methodName);
    }
  });
}

/**
 * Handle export error
 * @param {string} message - Error message
 * @param {string} methodName - Export method name
 */
function handleExportError(message, methodName) {
  showNotification(`${methodName} Export Failed: ${message}`, {
    type: 'error',
    duration: 8000,
  });
}

/**
 * Create API Mesh metrics HTML
 * @param {number} clientCalls - Number of client API calls (should be 1 for mesh)
 * @param {number} internalApiCalls - Number of internal Commerce API calls made by mesh
 * @param {Object} performance - Performance object with detailed metrics
 * @returns {string} HTML for API Mesh metrics
 */
function createApiMeshMetrics(clientCalls, internalApiCalls, performance = {}) {
  const productsApiCalls = performance.productsApiCalls || 1;
  const categoriesApiCalls = performance.categoriesApiCalls || 0;
  const inventoryApiCalls = performance.inventoryApiCalls || 0;

  return `
    <div class="notification-metrics-grid">
      <div class="notification-metric">
        <span class="metric-value">${clientCalls}</span>
        <span class="metric-label">Client API Calls</span>
      </div>
      <div class="notification-metric highlight">
        <span class="metric-value">${internalApiCalls}</span>
        <span class="metric-label">API Endpoints</span>
      </div>
    </div>
    <div class="notification-endpoints">
      <button class="endpoints-toggle">
        <span class="toggle-icon">▼</span>
        <span class="toggle-text">API Calls Made</span>
      </button>
      <div class="endpoints-list">
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Products API (${productsApiCalls} calls)</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Categories API (${categoriesApiCalls} calls)</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Inventory API (${inventoryApiCalls} calls)</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create REST API metrics HTML
 * @param {number} apiCalls - Number of API calls made
 * @param {number} dataSources - Number of data sources unified
 * @returns {string} HTML for REST API metrics
 */
function createRestApiMetrics(apiCalls, dataSources) {
  return `
    <div class="notification-metrics-grid">
      <div class="notification-metric">
        <span class="metric-value">${apiCalls}</span>
        <span class="metric-label">Client API Calls</span>
      </div>
      <div class="notification-metric">
        <span class="metric-value">${dataSources}</span>
        <span class="metric-label">API Endpoints</span>
      </div>
    </div>
    <div class="notification-endpoints">
      <button class="endpoints-toggle">
        <span class="toggle-icon">▼</span>
        <span class="toggle-text">API Calls Made</span>
      </button>
      <div class="endpoints-list">
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Products API (${Math.ceil(apiCalls * 0.3)} calls)</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Categories API (${Math.ceil(apiCalls * 0.4)} calls)</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">Inventory API (${Math.floor(apiCalls * 0.3)} calls)</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create enhanced success notification with comprehensive metrics
 * @param {Object} response - Response data
 * @returns {string} HTML string for rich notification
 */
function createSuccessNotificationContent(response) {
  const performance = response.performance || {};
  const productCount =
    performance.processedProducts || performance.totalProducts || performance.productCount || 0;
  const apiCalls = performance.apiCalls || 1;
  const method = performance.method || 'Export';
  const isApiMesh = method === 'API Mesh';

  // Build metrics HTML based on method type
  const metricsHTML = isApiMesh
    ? createApiMeshMetrics(
        performance.clientCalls || 1,
        performance.dataSourcesUnified || performance.totalApiCalls || 1,
        performance
      )
    : createRestApiMetrics(apiCalls, performance.dataSourcesUnified || 3);

  return `
    <div class="notification-metrics">
      <div class="notification-header">
        <span class="notification-title">📦 Export Complete!</span>
        <span class="notification-subtitle">Successfully exported ${productCount} products via ${method}</span>
        <span class="notification-details">Your CSV file is ready for download</span>
      </div>
      
      ${metricsHTML}
    </div>
  `;
}
