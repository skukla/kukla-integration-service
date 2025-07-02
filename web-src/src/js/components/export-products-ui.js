/**
 * Export Products UI Component
 * Manages export products responses, notifications, and user feedback
 */

import { showNotification } from '../ui/components/notifications/index.js';

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

// handleExportSuccess removed - no longer needed since we removed success toasts

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
 * Create enhanced success notification with comprehensive metrics
 * @param {Object} response - Response data
 * @returns {string} HTML string for rich notification
 */
function createSuccessNotificationContent(response) {
  const performance = response.performance || {};
  const productCount = performance.processedProducts || performance.totalProducts || 0;
  const duration = performance.durationFormatted || 'N/A';
  const apiCalls = performance.apiCalls || 1;
  const method = performance.method || 'Export';
  const isApiMesh = method === 'API Mesh';

  // Build metrics HTML based on method type
  let metricsHTML = '';

  if (isApiMesh) {
    // API Mesh: Show dynamic efficiency advantages
    const consolidation = performance.queryConsolidation || 'N/A';
    const dataSources = performance.dataSourcesUnified || 0;
    const optimizations = performance.meshOptimizations || [];

    metricsHTML = `
      <div class="notification-metrics-grid">
        <div class="notification-metric highlight">
          <span class="metric-value">${consolidation}</span>
          <span class="metric-label">Query Efficiency</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${dataSources}</span>
          <span class="metric-label">APIs Unified</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${apiCalls}</span>
          <span class="metric-label">Backend Calls</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${duration}</span>
          <span class="metric-label">Duration</span>
        </div>
      </div>
      <div class="notification-advantages">
        ${
          optimizations.length > 0
            ? optimizations.map((opt) => `<span class="advantage-tag">✨ ${opt}</span>`).join('')
            : '<span class="advantage-tag">🔗 Single GraphQL Query</span><span class="advantage-tag">🎯 Automated Orchestration</span>'
        }
      </div>
    `;
  } else {
    // REST API: Show dynamic traditional metrics with comparison context
    const dataSources = performance.dataSourcesUnified || 0;
    const consolidation = performance.queryConsolidation || 'N/A';

    metricsHTML = `
      <div class="notification-metrics-grid">
        <div class="notification-metric">
          <span class="metric-value">${apiCalls}</span>
          <span class="metric-label">Backend Calls</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${dataSources}</span>
          <span class="metric-label">APIs Used</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${consolidation}</span>
          <span class="metric-label">Client:Server</span>
        </div>
        <div class="notification-metric">
          <span class="metric-value">${duration}</span>
          <span class="metric-label">Duration</span>
        </div>
      </div>
      <div class="notification-advantages">
        <span class="advantage-tag">📦 Pre-aggregated Data</span>
        <span class="advantage-tag">⚡ Parallel Processing</span>
        <span class="advantage-tag">🔄 Server-side Orchestration</span>
      </div>
    `;
  }

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

// All styles now properly organized in CSS files using design system tokens
