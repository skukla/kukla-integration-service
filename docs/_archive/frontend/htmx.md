# HTMX Integration Guide

## Overview

This guide explains how HTMX is integrated into our application for dynamic UI updates without complex client-side JavaScript.

## Core Components

1. **Frontend Configuration (`web-src/src/js/htmx/config.js`)**
   - HTMX initialization
   - Global settings
   - Event handling setup

2. **Event System (`web-src/src/js/htmx/events.js`)**
   - Centralized event handling
   - Custom event definitions
   - Response processing

3. **Response Utilities (`actions/htmx/responses.js`)**
   - Standard response formatting
   - Error handling
   - Validation responses
   - Modal management

## Response Utilities

The HTMX response utilities provide a standardized way to create HTMX-compatible responses:

```javascript
const { createResponse, validationResponse } = require('../../htmx/responses');

// Standard response
const response = createResponse({
    html: '<div>Content</div>',
    status: 200,
    target: '#content',
    swap: 'innerHTML'
});

// Validation error response
const errors = {
    username: 'Username is required',
    email: 'Invalid email format'
};
const errorResponse = validationResponse(errors);
```

### Response Configuration

```javascript
const RESPONSE_CONFIG = {
    DEFAULT_STATUS: 200,
    ERROR_STATUS: 500,
    VALIDATION_STATUS: 400,
    CONTENT_TYPE: 'text/html',
    ERROR_TARGET: '#error-container',
    NOTIFICATION_TARGET: '#notification-container',
    TABLE_TARGET: '.table-content'
};
```

### Response Types

1. **Standard Response**

   ```javascript
   createResponse({
       html: string,          // HTML content
       status?: number,       // HTTP status code
       headers?: Object,      // Additional headers
       target?: string,       // Target element
       swap?: string,         // Swap method
       trigger?: string,      // Event to trigger
       triggerData?: Object   // Event data
   })
   ```

2. **Validation Response**

   ```javascript
   validationResponse(errors: Object, options?: Object)
   ```

## Frontend Integration

### Configuration Setup

```javascript
// web-src/src/js/htmx/config.js
htmx.config = {
    historyEnabled: true,
    defaultSwapStyle: 'innerHTML',
    requestClass: 'htmx-request',
    indicatorClass: 'htmx-indicator'
};
```

### Event Handling

```javascript
// web-src/src/js/htmx/events.js
document.addEventListener('htmx:afterRequest', (event) => {
    if (event.detail.successful) {
        handleSuccess(event);
    } else {
        handleError(event);
    }
});
```

## Best Practices

1. **Response Formatting**
   - Use standard response utilities
   - Include appropriate headers
   - Handle errors consistently

2. **Event Handling**
   - Centralize event logic
   - Use typed events
   - Maintain error boundaries

3. **Security**
   - Validate input data
   - Sanitize HTML content
   - Use CSRF protection

4. **Performance**
   - Minimize response size
   - Use appropriate swap methods
   - Cache where possible

## Example Usage

### Server-Side Handler

```javascript
const { createResponse } = require('../../htmx/responses');

async function handleRequest(params) {
    try {
        const data = await processRequest(params);
        return createResponse({
            html: generateHtml(data),
            target: '#content-area',
            trigger: 'contentLoaded',
            triggerData: { type: 'success' }
        });
    } catch (error) {
        return createResponse({
            html: generateErrorHtml(error),
            status: 500,
            target: '#error-container'
        });
    }
}
```

### Frontend Template

```html
<div hx-get="/api/data"
     hx-trigger="load"
     hx-target="#content"
     hx-indicator="#spinner">
    <div id="spinner" class="htmx-indicator">
        Loading...
    </div>
    <div id="content"></div>
</div>
```

## Debugging Tips

1. **Response Inspection**
   - Check network tab
   - Verify response headers
   - Validate HTML content

2. **Event Debugging**
   - Use htmx.logAll()
   - Monitor event details
   - Check trigger data

3. **Common Issues**
   - Missing target elements
   - Invalid HTML responses
   - Header configuration

## Additional Resources

- [HTMX Documentation](https://htmx.org/docs)
- [Response Headers Reference](https://htmx.org/reference/#headers)
- [Event System Details](https://htmx.org/reference/#events)
