# Testing Guide

> **Testing strategies and scripts for Adobe App Builder Commerce integration**

## Overview

This guide covers testing approaches for the Adobe App Builder application, including action testing, performance testing, and integration testing using the provided npm scripts.

## Available Testing Scripts

### **Action Testing**

```bash
# Test individual actions
npm run test:action -- actions/backend/get-products

# Test with parameters
npm run test:action -- actions/backend/get-products --param categoryId=123

# Test frontend actions
npm run test:action -- actions/frontend/browse-files
```

### **Performance Testing**

```bash
# Test performance in staging
npm run test:perf

# Test performance in production
npm run test:perf:prod
```

## Action Testing Deep Dive

### **Basic Action Testing**

The `test:action` script allows you to test individual Adobe I/O Runtime actions:

```bash
# Basic syntax
npm run test:action -- <action-path>

# Examples
npm run test:action -- actions/backend/get-products
npm run test:action -- actions/frontend/browse-files
npm run test:action -- actions/backend/download-file
npm run test:action -- actions/backend/delete-file
```

### **Testing with Parameters**

```bash
# Single parameter
npm run test:action -- actions/backend/get-products --param categoryId=123

# Multiple parameters
npm run test:action -- actions/backend/get-products \
  --param categoryId=123 \
  --param limit=50 \
  --param format=json

# Complex parameters (JSON)
npm run test:action -- actions/backend/get-products \
  --param '{"categoryId": "123", "limit": 50, "format": "json"}'
```

### **Environment-Specific Testing**

```bash
# Test in staging (default)
npm run test:action -- actions/backend/get-products

# Test with specific environment variables
LOG_LEVEL=debug npm run test:action -- actions/backend/get-products

# Test with Commerce credentials
COMMERCE_BASE_URL=https://your-instance.com \
COMMERCE_ADMIN_USERNAME=admin \
COMMERCE_ADMIN_PASSWORD=password123 \
npm run test:action -- actions/backend/get-products
```

## Performance Testing

### **Staging Performance Tests**

```bash
# Run all performance tests in staging
npm run test:perf

# This tests:
# - Action execution time
# - Memory usage
# - Response size
# - Commerce API response times
# - File operation performance
```

### **Production Performance Tests**

```bash
# Run performance tests in production (use carefully!)
npm run test:perf:prod

# Recommended: Run with limited scope
npm run test:perf:prod -- --light-mode
```

### **Performance Metrics**

The performance tests measure:

- **Action Execution Time**: Time from invocation to response
- **Memory Usage**: Peak memory consumption during execution
- **Commerce API Latency**: Response times from Adobe Commerce
- **File Operation Speed**: Upload/download/delete performance
- **Concurrent Request Handling**: Multiple simultaneous requests

### **Performance Thresholds**

Expected performance benchmarks:

| Operation     | Target Time | Warning Threshold | Error Threshold |
| ------------- | ----------- | ----------------- | --------------- |
| Get Products  | < 2s        | 3s                | 5s              |
| File Upload   | < 1s        | 2s                | 3s              |
| File Download | < 500ms     | 1s                | 2s              |
| File Delete   | < 300ms     | 500ms             | 1s              |

## Testing Patterns

### **Backend Action Testing**

Example test structure for backend actions:

```javascript
// Using the test:action script
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "electronics",
  "limit": 10,
  "format": "json",
  "LOG_LEVEL": "debug"
}'

// Expected response structure
{
  "statusCode": 200,
  "body": {
    "success": true,
    "message": "Product export completed successfully",
    "data": {
      "products": [...],
      "pagination": {...}
    }
  }
}
```

### **Frontend Action Testing**

Example test for HTMX frontend actions:

```javascript
// Test HTMX response action
npm run test:action -- actions/frontend/browse-files --param '{
  "path": "/uploads",
  "limit": 20,
  "LOG_LEVEL": "debug"
}'

// Expected response structure
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "text/html",
    "HX-Trigger": "files:loaded"
  },
  "body": "<div class=\"file-list\">...</div>"
}
```

### **Error Testing**

Testing error scenarios:

```bash
# Test validation errors
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "invalid-category",
  "limit": -1
}'

# Test authentication errors
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "123"
}' --no-auth

# Test Commerce API errors
COMMERCE_BASE_URL=https://invalid-url.com \
COMMERCE_ADMIN_USERNAME=admin \
COMMERCE_ADMIN_PASSWORD=password123 \
npm run test:action -- actions/backend/get-products
```

## Integration Testing

### **End-to-End Testing Workflow**

```bash
# 1. Deploy to staging
npm run deploy

# 2. Test individual actions
npm run test:action -- actions/backend/get-products
npm run test:action -- actions/frontend/browse-files

# 3. Run performance tests
npm run test:perf

# 4. Test UI interactions (manual)
open https://your-staging-url.adobeio-static.net
```

### **Commerce API Integration Testing**

```bash
# Test Commerce connection
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "test-category",
  "limit": 1,
  "LOG_LEVEL": "debug"
}'

# Verify response includes:
# - Valid product data
# - Proper error handling
# - Expected response format
# - Correct headers
```

### **File Operations Testing**

```bash
# Test file upload (via frontend action)
npm run test:action -- actions/frontend/upload-file --param '{
  "fileName": "test.txt",
  "fileContent": "base64-content-here",
  "LOG_LEVEL": "debug"
}'

# Test file deletion
npm run test:action -- actions/backend/delete-file --param '{
  "fileId": "test-file-id",
  "LOG_LEVEL": "debug"
}'
```

## Testing Best Practices

### **1. Test Isolation**

- Each test should be independent
- Clean up test data after tests
- Use unique identifiers for test data
- Don't rely on external state

### **2. Environment Management**

```bash
# Use environment-specific configurations
cp config/environments/.env.example config/environments/.env.testing

# Set appropriate log levels for testing
LOG_LEVEL=debug npm run test:action -- actions/backend/get-products
```

### **3. Error Validation**

```bash
# Test expected error scenarios
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "",
  "limit": 0
}' --expect-error

# Verify error response format
{
  "statusCode": 400,
  "body": {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid parameters"
    }
  }
}
```

### **4. Performance Baseline**

```bash
# Establish performance baselines
npm run test:perf -- --baseline

# Compare against baselines
npm run test:perf -- --compare-baseline
```

## Debugging Test Failures

### **Action Execution Logs**

```bash
# Enable detailed logging
LOG_LEVEL=debug npm run test:action -- actions/backend/get-products

# Check Adobe I/O Runtime logs
aio runtime:log:get

# View specific action logs
aio runtime:log:get --action get-products
```

### **Common Test Issues**

1. **Authentication Errors**

   ```bash
   # Verify credentials
   echo $COMMERCE_ADMIN_PASSWORD

   # Test authentication separately
   npm run test:action -- actions/backend/auth-test
   ```

2. **Timeout Issues**

   ```bash
   # Increase timeout for long-running operations
   TIMEOUT=60000 npm run test:action -- actions/backend/get-products
   ```

3. **Environment Variables**

   ```bash
   # Verify environment setup
   npm run test:action -- actions/backend/health-check

   # Check configuration
   npm run test:action -- actions/backend/config-check
   ```

## Continuous Testing

### **Pre-deployment Testing**

```bash
# Run before deployment
npm run test:action -- actions/backend/get-products
npm run test:action -- actions/frontend/browse-files
npm run test:perf

# All tests pass? Safe to deploy
npm run deploy
```

### **Post-deployment Verification**

```bash
# After deployment, verify with production-like data
npm run test:action -- actions/backend/get-products --param '{
  "categoryId": "production-category",
  "limit": 5
}'
```

### **Automated Testing Integration**

The testing scripts integrate with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Test Actions
  run: |
    npm run test:action -- actions/backend/get-products
    npm run test:action -- actions/frontend/browse-files

- name: Performance Tests
  run: npm run test:perf
```

## Related Documentation

- **[Development Setup](../getting-started/setup.md)** - Environment configuration
- **[Adobe App Builder Architecture](../architecture/adobe-app-builder.md)** - Platform patterns
- **[Coding Standards](coding-standards.md)** - Test code quality
- **[Deployment Guide](../deployment/environments.md)** - Testing in different environments

---

_This testing guide covers the npm scripts and patterns specific to Adobe App Builder action testing and performance validation._
