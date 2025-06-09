/**
 * Export Handler Component
 * Handles responses from export actions and provides user feedback
 */

import { showNotification } from '../ui/components/notifications/index.js';

// Simple export handler - no debouncing needed

/**
 * Initialize export handling
 */
export function initializeExportHandlers() {
  // Debug: Log HTMX loading states
  document.addEventListener('htmx:beforeRequest', (event) => {
    console.log('HTMX Before Request:', event.target);
    const loader = document.getElementById('export-loader');
    if (loader) {
      console.log('Loader element found, showing...');
      loader.style.display = 'flex';
    }
  });

  document.addEventListener('htmx:afterRequest', (event) => {
    console.log('HTMX After Request:', event.target);
    const loader = document.getElementById('export-loader');
    if (loader) {
      console.log('Loader element found, hiding...');
      loader.style.display = 'none';
    }
  });

  // Handle export responses
  document.addEventListener('htmx:beforeSwap', (event) => {
    if (event.target.id !== 'export-status') return;

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
        event.detail.serverResponse = createSuccessDisplay(response);
        // Auto-refresh file list after successful export (no toast needed)
        setTimeout(() => {
          const fileList = document.querySelector('[data-component="file-list"]');
          if (fileList && window.htmx) {
            window.htmx.trigger(fileList, 'htmx:trigger');
          }
        }, 1000);
      } else {
        event.detail.serverResponse = createErrorDisplay(response.message || response.error);
        // Show error notification only (errors still need toasts)
        handleExportError(response.message || response.error || 'Export failed', methodName);
      }
    } catch (error) {
      console.error('Error parsing export response:', error);
      event.detail.serverResponse = createErrorDisplay('Failed to parse export response');
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
 * Create success display
 * @param {Object} response - Response data
 * @returns {string} HTML string
 */
function createSuccessDisplay(response) {
  const performance = response.performance || {};

  return `
    <div class="export-status success">
      <h3 style="color: var(--color-success-active); margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">
        ✅ Export Complete
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-sm); margin-top: var(--spacing-md);">
        <div style="background: var(--color-white); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: var(--border-xs) solid var(--color-success-200);">
          <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-success-active);">
            ${performance.processedProducts || performance.totalProducts || 'N/A'}
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Products Exported</div>
        </div>
        
        <div style="background: var(--color-white); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: var(--border-xs) solid var(--color-blue-200);">
          <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-blue-primary);">
            ${performance.apiCalls || 1}
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">API Calls</div>
        </div>
        
        <div style="background: var(--color-white); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: var(--border-xs) solid var(--color-purple-200);">
          <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-purple-600);">
            ${performance.method || 'N/A'}
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Export Method</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create error display
 * @param {string} message - Error message
 * @returns {string} HTML string
 */
function createErrorDisplay(message) {
  return `
    <div class="export-status error">
      <h3 style="color: var(--color-danger-active); margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">
        ❌ Export Failed
      </h3>
      <p style="margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary);">
        ${message}
      </p>
    </div>
  `;
}

/**
 * Add enhanced styling for export results
 */
function addPerformanceStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Success Header */
    .success-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(46, 157, 120, 0.2);
    }
    
    .success-icon {
      font-size: 24px;
      line-height: 1;
    }
    
    .success-content h4 {
      margin: 0 0 4px 0;
      color: var(--color-success-active);
      font-size: 18px;
      font-weight: 600;
    }
    
    .success-content p {
      margin: 0;
      color: var(--color-gray-600);
      font-size: 14px;
    }

    /* Performance Comparison */
    .performance-comparison {
      margin: 20px 0;
      padding: 16px;
      background: linear-gradient(135deg, var(--color-blue-50) 0%, var(--color-success-background) 100%);
      border-radius: 8px;
      border: 1px solid var(--color-blue-200);
    }
    
    .performance-header h5 {
      margin: 0 0 16px 0;
      color: var(--color-gray-700);
      font-size: 16px;
      font-weight: 600;
    }
    
    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .metric-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .metric-icon {
      font-size: 20px;
      line-height: 1;
    }
    
    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-gray-800);
      line-height: 1;
    }
    
    .metric-label {
      font-size: 12px;
      color: var(--color-gray-500);
      font-weight: 500;
    }
    
    .efficiency-badge {
      text-align: center;
      padding: 8px 12px;
      background: var(--color-success);
      color: white;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .traditional-badge {
      text-align: center;
      padding: 8px 12px;
      background: var(--color-warning);
      color: white;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Storage Info */
    .storage-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16px 0;
      padding: 12px;
      background: var(--color-gray-50);
      border-radius: 6px;
      border: 1px solid var(--color-gray-200);
    }
    
    .storage-provider {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .storage-icon {
      font-size: 16px;
    }
    
    .storage-text {
      font-size: 14px;
      color: var(--color-gray-600);
      font-weight: 500;
    }
    
    .file-details {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .file-size {
      font-size: 13px;
      color: var(--color-gray-500);
      padding: 4px 8px;
      background: var(--color-gray-100);
      border-radius: 4px;
    }

    /* Process Steps */
    .process-steps {
      margin: 20px 0;
    }
    
    .process-steps h5 {
      margin: 0 0 12px 0;
      color: var(--color-gray-700);
      font-size: 16px;
      font-weight: 600;
    }
    
    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
    }
    
    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--color-blue-primary);
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .step-content {
      font-size: 14px;
      color: var(--color-gray-600);
      line-height: 1.4;
      margin-top: 2px;
    }

    /* Download Section */
    .download-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-200);
    }
    
    .download-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, var(--color-blue-primary) 0%, var(--color-blue-hover) 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(20, 115, 230, 0.2);
    }
    
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(20, 115, 230, 0.3);
      background: linear-gradient(135deg, var(--color-blue-hover) 0%, var(--color-blue-active) 100%);
    }
    
    .download-icon {
      font-size: 24px;
      line-height: 1;
    }
    
    .download-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .download-text {
      font-size: 16px;
      font-weight: 600;
      line-height: 1;
    }
    
    .download-subtitle {
      font-size: 13px;
      opacity: 0.9;
      line-height: 1;
    }

    /* Error Styles */
    .error-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(227, 72, 80, 0.2);
    }
    
    .error-icon {
      font-size: 24px;
      line-height: 1;
    }
    
    .error-content h4 {
      margin: 0 0 4px 0;
      color: var(--color-danger-active);
      font-size: 18px;
      font-weight: 600;
    }
    
    .error-message {
      margin: 0;
      color: var(--color-gray-600);
      font-size: 14px;
    }
    
    .error-actions {
      margin-top: 16px;
    }
    
    .error-suggestions h5 {
      margin: 0 0 8px 0;
      color: var(--color-gray-700);
      font-size: 14px;
      font-weight: 600;
    }
    
    .error-suggestions ul {
      margin: 0 0 16px 0;
      padding-left: 20px;
    }
    
    .error-suggestions li {
      margin-bottom: 4px;
      font-size: 13px;
      color: var(--color-gray-600);
    }
    
    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--color-blue-primary);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .retry-btn:hover {
      background: var(--color-blue-hover);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .performance-grid {
        grid-template-columns: 1fr;
      }
      
      .storage-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .success-header,
      .error-header {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeExportHandlers();
    addPerformanceStyles();
  });
} else {
  initializeExportHandlers();
  addPerformanceStyles();
}
