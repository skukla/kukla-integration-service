# Error Handling Guide

[← Back to README](../README.md)

## Core Concepts

Our error handling follows these principles:

- Simple, informative errors
- Clear user feedback
- Easy debugging
- Consistent patterns

## Error Types

```javascript
const ErrorTypes = {
  VALIDATION: {
    code: 400,
    retry: true
  },
  AUTH: {
    code: 401,
    retry: false
  },
  FORBIDDEN: {
    code: 403,
    retry: false
  },
  NOT_FOUND: {
    code: 404,
    retry: false
  },
  RATE_LIMIT: {
    code: 429,
    retry: true
  },
  SYSTEM: {
    code: 500,
    retry: true
  }
};
```

## Implementation

### Backend Errors

```javascript
// Core error response
function createErrorResponse(error, context = {}) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      canRetry: error.canRetry,
      context
    }
  };
}

// Usage example
try {
  const result = await someOperation();
  return response.success(result);
} catch (error) {
  return createErrorResponse(error, {
    operation: 'someOperation',
    input: params
  });
}
```

### Frontend Handling

```javascript
// HTMX error handling
htmx.on('htmx:error', (event) => {
  const error = event.detail.error;
  showNotification({
    type: 'error',
    message: error.message,
    action: error.canRetry ? 'Retry' : null
  });
});
```

## Error Patterns

### 1. Validation Errors

```javascript
throw new ValidationError('Invalid input', {
  field: 'username',
  constraint: 'required'
});
```

### 2. Commerce Errors

```javascript
throw new CommerceError('API error', {
  endpoint: '/products',
  status: response.status
});
```

### 3. File Operation Errors

```javascript
throw new FileError('Upload failed', {
  file: filename,
  size: filesize
});
```

## User Feedback

### 1. Error Messages

- Clear, actionable messages
- User-friendly language
- Suggested next steps
- Retry options when applicable

### 2. Loading States

- Clear progress indication
- Operation status
- Cancellation options
- Recovery paths

## Debugging

### 1. Error Context

- Operation details
- Input parameters
- System state
- Stack traces in development

### 2. Logging

- Error type and code
- Operation context
- Timestamp and request ID
- Related system state

## Best Practices

1. **Error Creation**
   - Use appropriate error type
   - Include relevant context
   - Set retry capability
   - Keep messages clear

2. **Error Handling**
   - Handle known cases
   - Provide fallbacks
   - Log appropriately
   - Give clear feedback

3. **Recovery**
   - Offer retry when possible
   - Provide alternatives
   - Clear error state
   - Maintain data integrity

For implementation details, see:

- [API Reference](api-reference.md)
- [Development Guide](development.md)
