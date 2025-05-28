# Frontend Architecture Guide

[← Back to README](../README.md) | Documentation: Frontend Architecture

---

## Overview

Our frontend architecture follows a hypermedia-driven approach using HTMX, with minimal JavaScript for enhanced interactions. This guide covers the frontend implementation details, patterns, and best practices.

For high-level architectural decisions and rationale, see the [Architecture Guide](architecture.md#frontend-architecture).

## HTMX Architecture

### Core Principles

1. **Hypermedia-Driven**

   - Server returns HTML instead of JSON
   - UI updates through HTML fragment swaps
   - Progressive enhancement where needed

2. **Minimal JavaScript**
   - HTMX handles most interactions
   - JavaScript only for enhanced functionality
   - No complex state management needed

### Module Organization

```plaintext
web-src/
└── src/
    └── js/
        ├── main.js              # Entry point
        ├── utils/
        │   ├── htmx-events.js   # Event handling
        │   ├── modal.js         # Modal management
        │   ├── notifications.js  # Notifications
        └── config/
            └── htmx.js         # HTMX configuration
```

## Implementation Details

### 1. HTMX Configuration

For API-specific details about HTMX responses and headers, see the [API Reference](api-reference.md#htmx-integration).

```javascript
// config/htmx.js
export function setupHtmx() {
  htmx.config = {
    timeout: 10000,
    historyCacheSize: 10,
    defaultSwapStyle: 'innerHTML',
    defaultSettleDelay: 20,
    includeIndicatorStyles: false,
    globalViewTransitions: true,
    allowScriptTags: false,
    allowEval: false,
  };
}
```

### 2. Event Handling

```javascript
// utils/htmx-events.js
export function setupEventHandlers() {
  // Loading states
  htmx.on('htmx:beforeRequest', (event) => {
    handleLoading(event.target);
  });

  // Success/error handling
  htmx.on('htmx:afterRequest', (event) => {
    handleResponse(event.detail);
  });

  // Error handling
  htmx.on('htmx:responseError', (event) => {
    handleError(event.detail);
  });
}
```

### 2.1 HTMX Events Reference

Our application uses the following HTMX events to handle various aspects of the UI:

#### Modal Events

- `htmx:afterSwap`

  - **Purpose**: Handles showing modals after content is swapped
  - **Implementation**: Shows modal if the target is a modal container
  - **Example**: Used when loading modal content dynamically

- `htmx:beforeSwap`
  - **Purpose**: Handles hiding modals before content is swapped
  - **Implementation**: Hides modal if the target is a table row
  - **Example**: Used when closing modals before updating content

#### Request Lifecycle Events

- `htmx:beforeRequest`

  - **Purpose**: Manages loading states when requests start
  - **Implementation**: Adds loading class to the requesting element
  - **Example**: Shows loading spinner on buttons during requests

- `htmx:afterRequest`

  - **Purpose**: Handles request completion and success states
  - **Implementation**: Removes loading class and shows success notifications
  - **Example**: Shows success message after file deletion

- `htmx:responseError`
  - **Purpose**: Handles failed requests and error states
  - **Implementation**: Shows error notifications and logs errors
  - **Example**: Displays error message when file operation fails

#### Configuration Events

- `htmx:configRequest`
  - **Purpose**: Sets up request headers and security tokens
  - **Implementation**: Configures XHR indicators and CSRF tokens
  - **Example**: Adds security headers to all HTMX requests

Each event is implemented in `web-src/src/js/utils/htmx-events.js` and follows our standard patterns for error handling, loading states, and user feedback.

### 3. Modal Management

```javascript
// utils/modal.js
export class Modal {
  constructor(id) {
    this.element = document.querySelector(`[data-modal-id="${id}"]`);
    this.setupEventListeners();
  }

  show() {
    this.element.classList.add('active');
    this.trapFocus();
  }

  hide() {
    this.element.classList.remove('active');
    this.restoreFocus();
  }
}
```

## Template Patterns

### 1. List Views

```html
<div
  id="file-list"
  hx-get="/api/files"
  hx-trigger="load, fileDeleted from:body"
  hx-target="this"
  hx-indicator="#loading"
>
  <!-- Content -->
</div>
```

### 2. Forms

```html
<form hx-post="/api/files/create" hx-target="#file-list" hx-swap="beforeend">
  <input type="text" name="filename" required />
  <button type="submit">Create</button>
</form>
```

### 3. Modals

```html
<div class="modal" data-modal-id="delete-confirm" role="dialog" aria-labelledby="modal-title">
  <div class="modal-content">
    <h2 id="modal-title">Confirm Delete</h2>
    <div class="modal-body">
      <!-- Content -->
    </div>
    <div class="modal-footer">
      <button hx-delete="/api/files/delete" hx-target="#file-list" hx-trigger="click">
        Delete
      </button>
    </div>
  </div>
</div>
```

## Best Practices

### 1. Data Attributes

Use data attributes for configuration:

```html
<div
  data-modal-id="file-delete"
  data-action-url="/api/files/delete"
  data-confirm-message="Are you sure?"
></div>
```

### 2. Event Handling

- Use event delegation where possible
- Keep event handlers focused
- Handle loading and error states consistently

### 3. Template Organization

- Keep templates focused and minimal
- Use consistent naming for triggers and targets
- Follow progressive enhancement principles

### 4. Error Handling

```javascript
function handleError(detail) {
  const { error, target } = detail;

  // Show error message
  showNotification('error', error.message);

  // Reset loading state
  target.classList.remove('loading');
}
```

## Debugging

### 1. HTMX Debugging

- Use `htmx.logAll()` in console
- Check network tab for requests
- Inspect HTML responses
- Use HTMX debug attributes

### 2. Common Issues

- Race conditions in rapid requests
- Modal focus management
- Event handling timing
- Response format mismatches

## Performance Considerations

1. **Response Size**

   - Return minimal HTML fragments
   - Avoid duplicate content
   - Use appropriate swap strategies

2. **Loading States**

   - Show immediate feedback
   - Use appropriate indicators
   - Handle timeouts gracefully

3. **Caching**
   - Use browser caching where appropriate
   - Consider view caching
   - Handle cache invalidation

## Accessibility

1. **Modal Management**

   - Trap focus within modals
   - Handle keyboard navigation
   - Manage ARIA states

2. **Loading States**

   - Use ARIA live regions
   - Provide progress indicators
   - Handle screen reader announcements

3. **Error Handling**
   - Clear error messages
   - Focus management
   - ARIA alert roles

## Related Documentation

- [Architecture Guide](architecture.md) - High-level architectural decisions
- [API Reference](api-reference.md#htmx-integration) - HTMX API integration details
- [Design System](design-system.md) - UI components and styling
- [Development Guide](development.md) - General development workflow
- [Troubleshooting Guide](troubleshooting.md) - Common issues and solutions
