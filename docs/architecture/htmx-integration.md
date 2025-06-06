# HTMX Integration Architecture

> **Progressive enhancement patterns for Adobe App Builder frontend integration**

## Overview

This guide explains how HTMX is integrated into the Adobe App Builder application for dynamic UI updates with minimal JavaScript, following progressive enhancement principles.

## Architecture Principles

### **Progressive Enhancement**

- Functionality works without JavaScript
- HTMX enhances the user experience
- Graceful degradation for all features
- Accessible by default

### **Staging-First Development**

- No local server setup required
- Deploy to staging for testing
- Use Adobe I/O Runtime for all backend logic
- Frontend assets served from Adobe I/O static hosting

## Core Components

### **1. Frontend Configuration**

Location: `web-src/src/js/htmx/config.js`

```javascript
// HTMX configuration for Adobe App Builder
htmx.config = {
  historyEnabled: true,
  defaultSwapStyle: 'innerHTML',
  requestClass: 'htmx-request',
  indicatorClass: 'htmx-indicator',
  timeout: 30000,
  // Security headers for Adobe I/O
  withCredentials: false,
  includeIndicatorStyles: true,
};

// Configure for Adobe I/O Runtime endpoints
htmx.defineExtension('adobe-io', {
  onEvent: function (name, evt) {
    if (name === 'htmx:configRequest') {
      // Add Adobe I/O specific headers
      evt.detail.headers['X-Requested-With'] = 'htmx';
    }
  },
});
```

### **2. Response Utilities**

Location: `src/htmx/responses.js`

```javascript
/**
 * Create HTMX-compatible response for Adobe I/O Runtime actions
 *
 * @param {Object} options - Response configuration
 * @param {string} options.html - HTML content to return
 * @param {number} [options.status=200] - HTTP status code
 * @param {Object} [options.headers={}] - Additional headers
 * @param {string} [options.target] - HTMX target selector
 * @param {string} [options.swap='innerHTML'] - HTMX swap method
 * @param {string} [options.trigger] - Event to trigger on client
 * @param {Object} [options.triggerData] - Data for triggered event
 *
 * @returns {Object} Adobe I/O Runtime response object
 */
function createHTMXResponse({
  html,
  status = 200,
  headers = {},
  target,
  swap = 'innerHTML',
  trigger,
  triggerData,
}) {
  const responseHeaders = {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache',
    ...headers,
  };

  // Add HTMX-specific headers
  if (target) responseHeaders['HX-Retarget'] = target;
  if (swap !== 'innerHTML') responseHeaders['HX-Reswap'] = swap;
  if (trigger) {
    responseHeaders['HX-Trigger'] = triggerData
      ? JSON.stringify({ [trigger]: triggerData })
      : trigger;
  }

  return {
    statusCode: status,
    headers: responseHeaders,
    body: html,
  };
}

/**
 * Create validation error response for forms
 */
function createValidationResponse(errors, target = '#form-errors') {
  const errorHtml = Object.entries(errors)
    .map(([field, message]) => `<div class="error" data-field="${field}">${message}</div>`)
    .join('');

  return createHTMXResponse({
    html: `<div class="validation-errors">${errorHtml}</div>`,
    status: 400,
    target,
    trigger: 'validation:failed',
    triggerData: { errors },
  });
}

module.exports = {
  createHTMXResponse,
  createValidationResponse,
};
```

### **3. Event System**

Location: `web-src/src/js/htmx/events.js`

```javascript
// Centralized HTMX event handling for Adobe App Builder
class HTMXEventManager {
  constructor() {
    this.setupGlobalEvents();
    this.setupErrorHandling();
    this.setupProgressIndicators();
  }

  setupGlobalEvents() {
    // Handle successful requests
    document.addEventListener('htmx:afterRequest', (event) => {
      if (event.detail.successful) {
        this.handleSuccess(event);
      } else {
        this.handleError(event);
      }
    });

    // Handle form submissions
    document.addEventListener('htmx:beforeRequest', (event) => {
      this.prepareRequest(event);
    });

    // Handle response processing
    document.addEventListener('htmx:beforeSwap', (event) => {
      this.processResponse(event);
    });
  }

  setupErrorHandling() {
    document.addEventListener('htmx:responseError', (event) => {
      const { status, response } = event.detail.xhr;

      // Handle different error types
      switch (status) {
        case 401:
          this.handleAuthError();
          break;
        case 429:
          this.handleRateLimit(response);
          break;
        case 500:
          this.handleServerError(response);
          break;
        default:
          this.handleGenericError(status, response);
      }
    });
  }

  setupProgressIndicators() {
    document.addEventListener('htmx:beforeRequest', () => {
      document.body.classList.add('htmx-loading');
    });

    document.addEventListener('htmx:afterRequest', () => {
      document.body.classList.remove('htmx-loading');
    });
  }

  handleSuccess(event) {
    // Trigger custom success events
    const trigger = event.detail.xhr.getResponseHeader('HX-Trigger');
    if (trigger) {
      try {
        const triggers = JSON.parse(trigger);
        Object.entries(triggers).forEach(([name, data]) => {
          document.dispatchEvent(new CustomEvent(name, { detail: data }));
        });
      } catch {
        document.dispatchEvent(new CustomEvent(trigger));
      }
    }
  }

  handleError(event) {
    console.error('HTMX request failed:', event.detail);
    // Show user-friendly error message
    this.showNotification('Request failed. Please try again.', 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize event manager
document.addEventListener('DOMContentLoaded', () => {
  new HTMXEventManager();
});
```

## Frontend Action Patterns

### **File Browser Action**

Location: `actions/frontend/browse-files/index.js`

```javascript
const { Core } = require('@adobe/aio-sdk');
const { createHTMXResponse } = require('../../src/htmx/responses');
const { getFileList } = require('../../src/core/files');

async function main(params) {
  const logger = Core.Logger('browse-files', { level: params.LOG_LEVEL });

  try {
    const files = await getFileList(params);

    // Generate HTML for file list
    const html = generateFileListHTML(files);

    return createHTMXResponse({
      html,
      target: '#file-browser',
      trigger: 'files:loaded',
      triggerData: { count: files.length },
    });
  } catch (error) {
    logger.error('File browse failed', error);

    return createHTMXResponse({
      html: '<div class="error">Unable to load files</div>',
      status: 500,
      target: '#file-browser',
    });
  }
}

function generateFileListHTML(files) {
  return `
    <div class="file-list">
      ${files
        .map(
          (file) => `
        <div class="file-item" data-file-id="${file.id}">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
          <button 
            hx-delete="/api/v1/web/kukla-integration-service/delete-file"
            hx-vals='{"fileId": "${file.id}"}'
            hx-target="closest .file-item"
            hx-swap="outerHTML"
            hx-confirm="Delete this file?"
            class="btn btn--danger btn--small">
            Delete
          </button>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

exports.main = main;
```

## HTML Templates

### **Progressive Enhancement Structure**

```html
<!-- Base HTML that works without JavaScript -->
<form
  action="/api/v1/web/kukla-integration-service/upload-file"
  method="post"
  enctype="multipart/form-data"
  hx-post="/api/v1/web/kukla-integration-service/upload-file"
  hx-target="#upload-result"
  hx-indicator="#upload-spinner"
>
  <div class="form-group">
    <label for="file">Select File:</label>
    <input type="file" id="file" name="file" required />
  </div>

  <button type="submit">
    Upload File
    <div id="upload-spinner" class="htmx-indicator spinner"></div>
  </button>
</form>

<!-- Results container -->
<div id="upload-result"></div>
```

### **Dynamic Content Areas**

```html
<!-- File browser with HTMX enhancement -->
<div class="file-browser">
  <div class="toolbar">
    <button
      hx-get="/api/v1/web/kukla-integration-service/browse-files"
      hx-target="#file-list"
      hx-indicator="#loading"
    >
      Refresh Files
    </button>
  </div>

  <div id="file-list" hx-get="/api/v1/web/kukla-integration-service/browse-files" hx-trigger="load">
    <!-- Files loaded via HTMX -->
    <div id="loading" class="htmx-indicator">Loading files...</div>
  </div>
</div>
```

## Best Practices

### **1. Response Design**

- Always provide fallback HTML for non-HTMX requests
- Use semantic HTML elements
- Include appropriate ARIA attributes
- Keep responses lightweight

### **2. Error Handling**

- Provide user-friendly error messages
- Use appropriate HTTP status codes
- Include retry mechanisms for temporary failures
- Log detailed errors server-side

### **3. Performance**

- Cache responses when appropriate
- Use compression for large responses
- Implement progressive loading for large datasets
- Minimize HTML payload size

### **4. Security**

- Validate all inputs server-side
- Use CSRF protection for state-changing operations
- Sanitize HTML content
- Implement rate limiting

## Debugging HTMX

### **Enable Debug Logging**

```javascript
// Add to your page for debugging
htmx.logger = function (elt, event, data) {
  if (console) {
    console.log(event, elt, data);
  }
};
```

### **Common Issues**

1. **Missing Target Elements**

   ```javascript
   // Verify target exists before swapping
   document.addEventListener('htmx:beforeSwap', (event) => {
     const target = document.querySelector(event.detail.target);
     if (!target) {
       console.warn('HTMX target not found:', event.detail.target);
       event.preventDefault();
     }
   });
   ```

2. **Response Headers**

   - Ensure `Content-Type: text/html` for HTML responses
   - Include HTMX headers (`HX-Trigger`, `HX-Retarget`, etc.)
   - Set appropriate cache headers

3. **Form Submissions**
   - Use proper HTTP methods (POST for state changes)
   - Include CSRF tokens
   - Validate server-side

## Integration with Adobe I/O Runtime

### **Action URL Generation**

```javascript
// Generate action URLs for HTMX attributes
function getActionURL(actionName, workspace = 'stage') {
  const namespace = process.env.AIO_runtime_namespace;
  const baseURL = `https://${namespace}-${workspace}.adobeio-static.net`;
  return `${baseURL}/api/v1/web/kukla-integration-service/${actionName}`;
}
```

### **Environment-Aware Configuration**

```javascript
// Configure HTMX based on deployment environment
const isProduction = process.env.NODE_ENV === 'production';
const timeout = isProduction ? 30000 : 60000;

htmx.config.timeout = timeout;
htmx.config.requestClass = isProduction ? 'loading' : 'loading debug';
```

## Related Documentation

- **[Adobe App Builder Platform](adobe-app-builder.md)** - Platform overview and patterns
- **[Commerce Integration](commerce-integration.md)** - API integration patterns
- **[Development Setup](../getting-started/setup.md)** - Environment configuration
- **[Coding Standards](../development/coding-standards.md)** - Code quality guidelines

---

_This guide covers HTMX integration patterns specific to Adobe App Builder applications with progressive enhancement principles._
