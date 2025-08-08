/**
 * Export Products UI Component
 * Manages export products responses, notifications, and user feedback
 */

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
        <span class="metric-label">Calls</span>
      </div>
      <div class="notification-metric highlight">
        <span class="metric-value">${internalApiCalls}</span>
        <span class="metric-label">Endpoints</span>
      </div>
      ${
        performance.executionTime !== undefined
          ? `
      <div class="notification-metric">
        <span class="metric-value">${formatExecutionTime(performance.executionTime)}</span>
        <span class="metric-label">Time</span>
      </div>
      `
          : ''
      }
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
 * @param {Object} performance - Performance object with detailed metrics
 * @returns {string} HTML for REST API metrics
 */
function createRestApiMetrics(apiCalls, dataSources, performance = {}) {
  return `
    <div class="notification-metrics-grid">
      <div class="notification-metric">
        <span class="metric-value">${apiCalls}</span>
        <span class="metric-label">Calls</span>
      </div>
      <div class="notification-metric">
        <span class="metric-value">${dataSources}</span>
        <span class="metric-label">Endpoints</span>
      </div>
      ${
        performance.executionTime !== undefined
          ? `
      <div class="notification-metric">
        <span class="metric-value">${formatExecutionTime(performance.executionTime)}</span>
        <span class="metric-label">Time</span>
      </div>
      `
          : ''
      }
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
 * Format execution time in human-readable format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatExecutionTime(ms) {
  if (!ms) return '';
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
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
    : createRestApiMetrics(apiCalls, performance.dataSourcesUnified || 3, performance);

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

// Export functions for use in main.js
export { createSuccessNotificationContent, toggleEndpoints };
