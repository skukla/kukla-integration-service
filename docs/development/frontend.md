# Frontend Development Guide

> **HTMX-driven frontend development patterns for Adobe App Builder**

## Overview

This guide covers frontend development for the Adobe App Builder Commerce integration service. Our frontend follows a hypermedia-driven approach using HTMX with minimal JavaScript for enhanced interactions.

## Architecture Principles

### **Hypermedia-Driven Design**

1. **Server Returns HTML**: Actions return HTML fragments instead of JSON
2. **Progressive Enhancement**: Base functionality works without JavaScript
3. **Minimal State Management**: Server manages state, UI reflects it
4. **Event-Driven Updates**: HTMX handles UI updates through HTML swaps

### **Technology Stack**

- **HTMX**: Core hypermedia interactions
- **Vanilla JavaScript**: Enhanced functionality only
- **CSS**: Styling and animations
- **Adobe I/O Files**: File storage integration

## Project Structure

```
web-src/
├── index.html              # Main application entry point
├── src/
│   ├── css/
│   │   ├── main.css        # Global styles
│   │   ├── components/     # Component-specific styles
│   │   └── utilities/      # Utility classes
│   ├── js/
│   │   ├── main.js         # Application entry point
│   │   ├── core/
│   │   │   ├── config.js   # Auto-generated configuration
│   │   │   └── url.js      # Auto-generated URL functions
│   │   ├── htmx/
│   │   │   └── setup.js    # HTMX configuration and setup
│   │   └── ui/
│   │       ├── downloads/  # Download functionality
│   │       ├── file-browser/ # File browser components
│   │       └── modals/     # Modal management
│   └── config/
│       └── generated/      # Auto-generated configuration files
├── assets/
│   ├── icons/              # SVG icons
│   └── images/             # Static images
└── components/             # Reusable HTML components
    ├── modals/
    ├── forms/
    └── tables/
```

## HTMX Configuration

### **Auto-Generated Configuration**

The HTMX configuration uses auto-generated settings from the backend configuration:

```javascript
// web-src/src/js/htmx/setup.js
import { getTimeout } from '../core/config.js';

export function setupHtmx() {
  // Configure HTMX with auto-generated settings
  htmx.config = {
    timeout: getTimeout(), // From backend performance config
    historyCacheSize: 10, // Cache last 10 pages
    defaultSwapStyle: 'innerHTML', // Default swap method
    defaultSettleDelay: 20, // Settle animations
    includeIndicatorStyles: false, // Custom loading styles
    globalViewTransitions: true, // Smooth transitions
    allowScriptTags: false, // Security: no script execution
    allowEval: false, // Security: no eval()
  };

  // Set global headers
  htmx.on('htmx:configRequest', (event) => {
    // Add CSRF token to all requests
    event.detail.headers['X-CSRF-Token'] = getCsrfToken();

    // Add custom headers for Adobe I/O Runtime
    event.detail.headers['X-App-Source'] = 'htmx-frontend';
    event.detail.headers['X-Request-ID'] = generateRequestId();
  });
}

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### **Component Configuration**

The system includes a component configuration system for consistent HTMX attributes:

```javascript
// Component configuration with auto-generated URLs
const COMPONENT_CONFIG = {
  'file-list': {
    'hx-get': () => getActionUrl('browse-files'),
    'hx-trigger': 'load once',
    'hx-swap': 'innerHTML',
    'hx-indicator': '#content-loader',
  },
  'delete-button': {
    'hx-get': (el) =>
      getActionUrl('delete-file', {
        fileName: el.dataset.fileName,
        fullPath: el.dataset.downloadUrl,
      }),
    'hx-target': '#modal-container',
    'hx-swap': 'innerHTML',
  },
};
```

### **Dynamic Content Processing**

For dynamically created content, HTMX requires explicit processing:

```javascript
// After creating modal content dynamically
const modalContainer = document.getElementById('modal-container');
modalContainer.innerHTML = modalHTML;
window.htmx.process(modalContainer); // Required for hx-* attributes to work
```

### **Event System**

```javascript
// web-src/src/js/htmx/events.js
export function initializeHtmxEvents() {
  // Loading states
  htmx.on('htmx:beforeRequest', (event) => {
    handleLoadingStart(event.target);
  });

  htmx.on('htmx:afterRequest', (event) => {
    handleLoadingEnd(event.target);
    handleResponse(event.detail);
  });

  // Error handling
  htmx.on('htmx:responseError', (event) => {
    handleError(event.detail);
  });

  htmx.on('htmx:sendError', (event) => {
    handleNetworkError(event.detail);
  });

  // Modal management
  htmx.on('htmx:afterSwap', (event) => {
    handleModalShow(event.target);
    initializeComponents(event.target);
  });

  htmx.on('htmx:beforeSwap', (event) => {
    handleModalHide(event.target);
  });
}

function handleLoadingStart(element) {
  element.classList.add('loading');
  element.setAttribute('aria-busy', 'true');

  // Show loading indicator
  const indicator = element.querySelector('.loading-indicator');
  if (indicator) {
    indicator.style.display = 'inline-block';
  }
}

function handleLoadingEnd(element) {
  element.classList.remove('loading');
  element.setAttribute('aria-busy', 'false');

  // Hide loading indicator
  const indicator = element.querySelector('.loading-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function handleResponse(detail) {
  const { xhr } = detail;

  // Handle success notifications
  const notification = xhr.getResponseHeader('X-Notification');
  if (notification) {
    showNotification(JSON.parse(notification));
  }

  // Handle redirects
  const redirect = xhr.getResponseHeader('X-Redirect');
  if (redirect) {
    window.location.href = redirect;
  }

  // Handle custom events
  const customEvent = xhr.getResponseHeader('X-Trigger-Event');
  if (customEvent) {
    htmx.trigger(document.body, customEvent);
  }
}

function handleError(detail) {
  const { xhr } = detail;

  console.error('HTMX Request Error:', {
    status: xhr.status,
    statusText: xhr.statusText,
    responseText: xhr.responseText,
  });

  // Show user-friendly error
  showNotification({
    type: 'error',
    title: 'Request Failed',
    message: 'An error occurred while processing your request. Please try again.',
  });
}
```

## Component Patterns

### **Data Tables with Auto-Generated URLs**

```html
<!-- File listing with HTMX -->
<div id="file-list-container">
  <!-- Using component configuration system -->
  <div
    data-component="file-list"
    hx-trigger="load once"
    hx-target="#file-list"
    hx-indicator="#loading-files"
  ></div>

  <!-- Loading indicator -->
  <div id="loading-files" class="loading-indicator" style="display: none;">
    <span class="spinner"></span> Loading files...
  </div>

  <!-- File list table -->
  <div id="file-list">
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Modified</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Server-rendered file rows -->
        <tr data-file-id="file-123">
          <td>
            <span class="file-icon">📄</span>
            products-export.csv
          </td>
          <td>1.2 MB</td>
          <td>2024-01-15 10:30</td>
          <td class="actions">
            <!-- Download action -->
            <button
              hx-get="/api/v1/web/kukla-integration-service/backend/download-file"
              hx-vals='{"fileId": "file-123"}'
              hx-trigger="click"
              class="btn btn-sm btn-primary"
            >
              Download
            </button>

            <!-- Delete action with confirmation -->
            <button
              hx-delete="/api/v1/web/kukla-integration-service/backend/delete-file"
              hx-vals='{"fileId": "file-123"}'
              hx-confirm="Are you sure you want to delete this file?"
              hx-target="closest tr"
              hx-swap="outerHTML"
              class="btn btn-sm btn-danger"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### **Forms with Validation**

```html
<!-- Product export form -->
<form
  hx-post="/api/v1/web/kukla-integration-service/backend/get-products"
  hx-target="#export-results"
  hx-indicator="#export-loading"
  hx-swap="innerHTML"
  class="export-form"
>
  <div class="form-group">
    <label for="categoryId">Category ID</label>
    <input
      type="text"
      id="categoryId"
      name="categoryId"
      placeholder="e.g., electronics"
      required
      class="form-control"
    />
    <small class="form-text">Enter the category ID to filter products</small>
  </div>

  <div class="form-group">
    <label for="format">Export Format</label>
    <select id="format" name="format" class="form-control">
      <option value="json">JSON</option>
      <option value="csv">CSV</option>
    </select>
  </div>

  <div class="form-group">
    <label for="fields">Fields to Include</label>
    <div class="checkbox-group">
      <label class="checkbox">
        <input type="checkbox" name="fields" value="sku" checked />
        SKU
      </label>
      <label class="checkbox">
        <input type="checkbox" name="fields" value="name" checked />
        Name
      </label>
      <label class="checkbox">
        <input type="checkbox" name="fields" value="price" checked />
        Price
      </label>
      <label class="checkbox">
        <input type="checkbox" name="fields" value="qty" />
        Quantity
      </label>
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">
      <span class="button-text">Export Products</span>
      <span id="export-loading" class="loading-indicator" style="display: none;">
        <span class="spinner"></span>
      </span>
    </button>
  </div>

  <!-- Results area -->
  <div id="export-results" class="export-results"></div>
</form>
```

### **Modal Dialogs**

```html
<!-- Modal container (always present) -->
<div id="modal-container" class="modal-overlay" style="display: none;">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- Content loaded dynamically -->
    </div>
  </div>
</div>

<!-- Trigger button -->
<button
  hx-get="/api/v1/web/kukla-integration-service/frontend/modal-content"
  hx-vals='{"type": "confirmation", "fileId": "file-123"}'
  hx-target="#modal-container .modal-content"
  hx-swap="innerHTML"
  class="btn btn-danger"
>
  Delete File
</button>
```

## JavaScript Enhancement

### **Modal Management**

```javascript
// web-src/src/js/utils/modal.js
export class ModalManager {
  constructor() {
    this.modalContainer = document.getElementById('modal-container');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Show modal after content is loaded
    htmx.on('htmx:afterSwap', (event) => {
      if (event.target.closest('#modal-container')) {
        this.showModal();
      }
    });

    // Hide modal on backdrop click
    this.modalContainer.addEventListener('click', (event) => {
      if (event.target === this.modalContainer) {
        this.hideModal();
      }
    });

    // Hide modal on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isModalVisible()) {
        this.hideModal();
      }
    });
  }

  showModal() {
    this.modalContainer.style.display = 'flex';
    this.modalContainer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Focus management
    this.trapFocus();
  }

  hideModal() {
    this.modalContainer.style.display = 'none';
    this.modalContainer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    // Restore focus
    this.restoreFocus();
  }

  isModalVisible() {
    return this.modalContainer.style.display !== 'none';
  }

  trapFocus() {
    const focusableElements = this.modalContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  restoreFocus() {
    // Return focus to trigger element if available
    const lastActiveElement = document.querySelector('[data-modal-trigger]');
    if (lastActiveElement) {
      lastActiveElement.focus();
    }
  }
}
```

### **Notification System**

```javascript
// web-src/src/js/utils/notifications.js
export class NotificationManager {
  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    return container;
  }

  show(notification) {
    const { type = 'info', title, message, duration = 5000 } = notification;

    const element = document.createElement('div');
    element.className = `notification notification-${type}`;
    element.innerHTML = `
      <div class="notification-content">
        ${title ? `<h4 class="notification-title">${title}</h4>` : ''}
        <p class="notification-message">${message}</p>
      </div>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    // Close button handler
    element.querySelector('.notification-close').addEventListener('click', () => {
      this.hide(element);
    });

    // Auto-hide
    if (duration > 0) {
      setTimeout(() => this.hide(element), duration);
    }

    this.container.appendChild(element);

    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('notification-show');
    });
  }

  hide(element) {
    element.classList.add('notification-hide');
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }
}

// Global notification function
window.showNotification = (notification) => {
  if (!window.notificationManager) {
    window.notificationManager = new NotificationManager();
  }
  window.notificationManager.show(notification);
};
```

## CSS Styling Patterns

### **Component-Based CSS**

```css
/* web-src/src/css/components/data-table.css */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f9f9f9;
}

.data-table .actions {
  white-space: nowrap;
}

.data-table .actions .btn {
  margin-right: 8px;
}

.data-table .actions .btn:last-child {
  margin-right: 0;
}

/* Loading states */
.data-table.loading {
  opacity: 0.6;
  pointer-events: none;
}

.data-table [aria-busy='true'] {
  position: relative;
}

.data-table [aria-busy='true']::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### **HTMX Transition Styles**

```css
/* web-src/src/css/utilities/transitions.css */
.htmx-indicator {
  opacity: 0;
  transition: opacity 200ms ease-in;
}

.htmx-request .htmx-indicator {
  opacity: 1;
}

.htmx-request.htmx-indicator {
  opacity: 1;
}

/* Swap animations */
.htmx-swapping {
  opacity: 0;
  transform: translateY(-10px);
  transition:
    opacity 300ms ease-out,
    transform 300ms ease-out;
}

.htmx-settling {
  opacity: 1;
  transform: translateY(0);
}

/* Custom swap animations for different content types */
.notification-swap {
  transform: translateX(100%);
  transition: transform 300ms ease-out;
}

.notification-swap.htmx-settling {
  transform: translateX(0);
}
```

## Best Practices

### **HTMX Patterns**

1. **Use Semantic HTML**

   ```html
   <!-- Good: Semantic structure -->
   <button hx-delete="/api/files/123" class="btn btn-danger">Delete File</button>

   <!-- Avoid: Generic div -->
   <div hx-delete="/api/files/123" class="clickable">Delete File</div>
   ```

2. **Progressive Enhancement**

   ```html
   <!-- Works without JavaScript -->
   <form action="/api/files/upload" method="post" enctype="multipart/form-data">
     <input type="file" name="file" required />
     <button type="submit">Upload</button>
   </form>

   <!-- Enhanced with HTMX -->
   <form
     action="/api/files/upload"
     method="post"
     enctype="multipart/form-data"
     hx-post="/api/files/upload"
     hx-target="#upload-results"
   >
     <input type="file" name="file" required />
     <button type="submit">Upload</button>
   </form>
   ```

3. **Proper Error Handling**
   ```html
   <!-- Include error handling -->
   <div
     hx-get="/api/files"
     hx-trigger="load"
     hx-target="this"
     hx-indicator="#loading"
     hx-on="htmx:responseError: showNotification({type: 'error', message: 'Failed to load files'})"
   >
     <!-- Content -->
   </div>
   ```

### **Accessibility**

1. **ARIA Attributes**

   ```html
   <button
     hx-delete="/api/files/123"
     aria-describedby="delete-confirmation"
     hx-confirm="Are you sure?"
   >
     Delete
   </button>
   <div id="delete-confirmation" class="sr-only">This action cannot be undone</div>
   ```

2. **Loading States**

   ```html
   <div hx-get="/api/files" aria-live="polite" aria-busy="false">
     <!-- Content -->
   </div>
   ```

3. **Keyboard Navigation**
   ```javascript
   // Ensure modals are keyboard accessible
   document.addEventListener('keydown', (event) => {
     if (event.key === 'Escape' && isModalOpen()) {
       closeModal();
     }
   });
   ```

## Performance Optimization

### **Lazy Loading**

```html
<!-- Load content when scrolled into view -->
<div hx-get="/api/files/page/2" hx-trigger="intersect once" hx-swap="afterend">
  <div class="loading-placeholder">Loading more files...</div>
</div>
```

### **Request Deduplication**

```html
<!-- Prevent duplicate requests -->
<input
  type="search"
  hx-get="/api/search"
  hx-trigger="input changed delay:300ms"
  hx-target="#search-results"
  hx-sync="this:drop"
/>
```

### **Caching**

```javascript
// Configure caching in HTMX
htmx.on('htmx:configRequest', (event) => {
  // Add cache headers for static content
  if (event.detail.path.includes('/api/files/')) {
    event.detail.headers['Cache-Control'] = 'max-age=300';
  }
});
```

## Debugging Frontend Issues

### **HTMX Debugging**

```javascript
// Enable HTMX logging
htmx.logger = function (elt, event, data) {
  if (console) {
    console.log('HTMX:', event, elt, data);
  }
};

// Debug specific events
htmx.on('htmx:beforeRequest', (event) => {
  console.log('Request:', event.detail);
});

htmx.on('htmx:responseError', (event) => {
  console.error('Response Error:', event.detail);
});
```

### **Common Issues**

1. **Actions Not Triggering**

   - Check HTMX attributes are correct
   - Verify endpoints are accessible
   - Check browser network tab

2. **Content Not Updating**

   - Verify target selectors
   - Check swap modes
   - Ensure content structure matches

3. **JavaScript Errors**
   - Check browser console
   - Verify event handlers are attached
   - Ensure HTMX is loaded

## Related Documentation

- **[Design System](design-system.md)** - Visual design language and component library
- **[Adobe App Builder Architecture](../architecture/adobe-app-builder.md)** - Backend action patterns
- **[HTMX Integration](../architecture/htmx-integration.md)** - Architectural decisions
- **[Testing Guide](testing.md)** - Frontend testing patterns
- **[Deployment Guide](../deployment/environments.md)** - Deploying frontend changes

---

_This frontend guide covers HTMX patterns, JavaScript enhancement, and development workflows for Adobe App Builder applications._
