# Frontend Development Guide

> **Practical development patterns for HTMX frontend development**

## Overview

This guide covers practical frontend development patterns for the Adobe App Builder Commerce integration service. For architectural details, see [HTMX Integration Architecture](../architecture/htmx-integration.md).

## Key Development Patterns

### **Dynamic Content Processing**

For dynamically created content, HTMX requires explicit processing:

```javascript
// After creating modal content dynamically
const modalContainer = document.getElementById('modal-container');
modalContainer.innerHTML = modalHTML;
window.htmx.process(modalContainer); // Required for hx-* attributes to work
```

### **Configuration Access**

Use the auto-generated configuration for consistent settings:

```javascript
import { getTimeout, isStaging } from '../core/config.js';
import { getActionUrl } from '../core/url.js';

// Configure HTMX with backend-generated settings
htmx.config.timeout = getTimeout();

// Build URLs with environment awareness
const downloadUrl = getActionUrl('download-file', { fileName: 'products.csv' });
```

### **Error Handling**

Standard error handling patterns for HTMX requests:

```javascript
// web-src/src/js/htmx/events.js
export function initializeHtmxEvents() {
  // Network error handling
  htmx.on('htmx:sendError', (event) => {
    showNotification({
      type: 'error',
      title: 'Network Error',
      message: 'Please check your connection and try again.',
    });
  });

  // HTTP error handling
  htmx.on('htmx:responseError', (event) => {
    const { xhr } = event.detail;
    let message = 'An error occurred';
    
    try {
      const errorResponse = JSON.parse(xhr.responseText);
      message = errorResponse.message || message;
    } catch (e) {
      message = `Server error (${xhr.status})`;
    }

    showNotification({
      type: 'error',
      title: 'Request Failed',
      message,
    });
  });
}
```

### **Loading States**

Consistent loading state management:

```javascript
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
```

## Component Development

### **Modal Management**

```javascript
// web-src/src/js/ui/modals/modal-manager.js
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
    this.trapFocus();
  }

  hideModal() {
    this.modalContainer.style.display = 'none';
    this.modalContainer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
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

## CSS Development Patterns

### **Component-Based Styling**

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

### **Loading Indicators**

```css
/* web-src/src/css/utilities/loading.css */
.loading-indicator {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Button loading states */
.btn.is-loading {
  position: relative;
  color: transparent;
}

.btn.is-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

## Best Practices

### **Progressive Enhancement**

1. **Start with HTML**: Ensure functionality works without JavaScript
2. **Add HTMX**: Enhance with hypermedia interactions
3. **Layer JavaScript**: Add custom behavior only when needed

### **Performance**

1. **Lazy Loading**: Use `hx-trigger="intersect"` for content below the fold
2. **Caching**: Use `hx-headers` to control caching behavior
3. **Minimal JavaScript**: Keep JavaScript footprint small

### **Accessibility**

1. **ARIA Attributes**: Use `aria-busy`, `aria-live`, `aria-hidden`
2. **Focus Management**: Handle focus in modals and dynamic content
3. **Keyboard Navigation**: Support escape key and tab navigation

### **Error Handling**

1. **Network Errors**: Always handle connection failures
2. **HTTP Errors**: Parse and display meaningful error messages
3. **Validation**: Show validation errors inline with forms

See [HTMX Integration Architecture](../architecture/htmx-integration.md) for architectural details and [Design System](./design-system.md) for styling guidelines.
