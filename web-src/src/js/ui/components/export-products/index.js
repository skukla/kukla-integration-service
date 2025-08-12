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
/**
 * Format API endpoint display with cache status
 * @param {string} name - API endpoint name
 * @param {number} calls - Number of API calls made
 * @param {number} total - Total number of operations needed
 * @returns {string} Formatted endpoint display string
 */
function formatEndpoint(name, calls, total) {
  const ratio = `${calls}/${total}`;
  const cacheStatus = calls === 0 ? ' 100% cached' : '';
  return `${name} (${ratio})${cacheStatus}`;
}

function createApiMeshMetrics(clientCalls, internalApiCalls, performance = {}) {
  // Extract API call counts - Mesh operations
  const productsApiCalls =
    performance.productsApiCalls !== undefined ? performance.productsApiCalls : 1;
  const categoriesApiCalls =
    performance.categoriesApiCalls !== undefined ? performance.categoriesApiCalls : 0;
  const inventoryApiCalls =
    performance.inventoryApiCalls !== undefined ? performance.inventoryApiCalls : 0;

  return `
    <div class="notification-metrics-grid">
      <div class="notification-metric">
        <span class="metric-value">${clientCalls}</span>
        <span class="metric-label">CLIENT CALLS</span>
      </div>
      <div class="notification-metric highlight">
        <span class="metric-value">${internalApiCalls}</span>
        <span class="metric-label">API ENDPOINTS</span>
      </div>
      ${
        performance.executionTime !== undefined
          ? `
      <div class="notification-metric">
        <span class="metric-value">${formatExecutionTime(performance.executionTime)}</span>
        <span class="metric-label">EXECUTION TIME</span>
      </div>
      `
          : ''
      }
    </div>
    <div class="notification-endpoints">
      <button class="endpoints-toggle">
        <span class="toggle-icon">▼</span>
        <span class="toggle-text">Mesh Operations</span>
      </button>
      <div class="endpoints-list">
        <div class="endpoint-item">
          <span class="endpoint-method">QUERY</span>
          <span class="endpoint-url">Products: ${productsApiCalls} ${productsApiCalls === 1 ? 'fetch' : 'fetches'}</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">QUERY</span>
          <span class="endpoint-url">Categories: ${categoriesApiCalls} ${categoriesApiCalls === 1 ? 'lookup' : 'lookups'}</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">QUERY</span>
          <span class="endpoint-url">Inventory: ${inventoryApiCalls} ${inventoryApiCalls === 1 ? 'batch' : 'batches'}</span>
        </div>
        <div class="endpoint-item cache-status">
          <span class="endpoint-method">INFO</span>
          <span class="endpoint-url">Backend API calls & caching handled by Mesh</span>
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
  const cacheHits = performance.cacheHits || 0;
  const cachingEnabled = performance.cachingEnabled || false;

  // Extract API call counts with fallbacks for older responses
  const adminTokenApiCalls =
    performance.adminTokenApiCalls !== undefined ? performance.adminTokenApiCalls : 1; // Default to 1 if not provided
  const productsApiCalls =
    performance.productsApiCalls !== undefined
      ? performance.productsApiCalls
      : Math.ceil(apiCalls * 0.3);
  const categoriesApiCalls =
    performance.categoriesApiCalls !== undefined
      ? performance.categoriesApiCalls
      : Math.ceil(apiCalls * 0.4);
  const inventoryApiCalls =
    performance.inventoryApiCalls !== undefined
      ? performance.inventoryApiCalls
      : Math.floor(apiCalls * 0.3);
  const totalProductPages = performance.totalProductPages || 1;
  const totalInventoryBatches = performance.totalInventoryBatches || 1;

  return `
    <div class="notification-metrics-grid">
      <div class="notification-metric">
        <span class="metric-value">${apiCalls}</span>
        <span class="metric-label">CLIENT CALLS</span>
      </div>
      <div class="notification-metric">
        <span class="metric-value">${dataSources}</span>
        <span class="metric-label">API ENDPOINTS</span>
      </div>
      ${
        performance.executionTime !== undefined
          ? `
      <div class="notification-metric">
        <span class="metric-value">${formatExecutionTime(performance.executionTime)}</span>
        <span class="metric-label">EXECUTION TIME</span>
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
          <span class="endpoint-method">POST</span>
          <span class="endpoint-url">${formatEndpoint('Admin Token', adminTokenApiCalls, 1)}</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">${formatEndpoint('Products API', productsApiCalls, totalProductPages)}</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">${formatEndpoint('Categories API', categoriesApiCalls, 1)}</span>
        </div>
        <div class="endpoint-item">
          <span class="endpoint-method">GET</span>
          <span class="endpoint-url">${formatEndpoint('Inventory API', inventoryApiCalls, totalInventoryBatches)}</span>
        </div>
        ${
          cachingEnabled
            ? `
        <div class="endpoint-item cache-status">
          <span class="endpoint-method">CACHE</span>
          <span class="endpoint-url">Commerce API Caching: ${cacheHits > 0 ? `${cacheHits} hits` : 'Enabled'}</span>
        </div>
        `
            : ''
        }
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

  // Check both response and performance object for product count
  const productCount =
    response.productCount ||
    response.totalProducts ||
    response.processedProducts ||
    performance.processedProducts ||
    performance.totalProducts ||
    performance.productCount ||
    0;
  const apiCalls = response.apiCalls || performance.apiCalls || 1;
  const method = response.method || performance.method || 'Export';

  // Note: Backend is not currently sending execution time data
  const isApiMesh = method === 'API Mesh';

  // Build metrics HTML based on method type
  // Combine response and performance data for metrics
  const combinedPerformance = {
    ...performance,
    executionTime:
      response.executionTime || response.duration || response.time || performance.executionTime,
  };

  const metricsHTML = isApiMesh
    ? createApiMeshMetrics(
        performance.clientCalls || 1,
        performance.dataSourcesUnified || performance.totalApiCalls || 1,
        combinedPerformance
      )
    : createRestApiMetrics(apiCalls, performance.dataSourcesUnified || 3, combinedPerformance);

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
