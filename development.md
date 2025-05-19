# Development Guide

[← Back to README](../README.md) | Documentation: Development

---

## Overview

This guide covers the development workflow and best practices for the Kukla Integration Service.

## Setup

1. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure variables
   COMMERCE_URL=<your-commerce-instance-url>
   COMMERCE_ADMIN_USERNAME=<your-commerce-admin-username>
   COMMERCE_ADMIN_PASSWORD=<your-commerce-admin-password>
   ```

2. **Adobe Developer Console Setup**
   - Create a new project
   - Enable App Builder
   - Download configuration
   - Run `aio app use <config-file>`

3. **Development Dependencies**
   ```bash
   npm install
   ```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run test        # Run tests

# Build and Deploy
npm run build       # Build with Vite
npm run clean       # Clean dist directory
npm run deploy      # Deploy everything
npm run deploy:web  # Deploy web assets only
npm run deploy:actions # Deploy actions only
```

## Module Organization

The project uses standard Node.js module resolution with relative paths for clear and maintainable imports.

### Best Practices

1. **Use Clear Relative Paths**
   ```javascript
   // Instead of complex paths like:
   const { headers } = require('../../../../shared/http/headers');

   // Break it down into steps:
   const { headers } = require('../../shared/http/headers');
   const { validateInput } = require('./steps/validateInput');
   ```

2. **Import Organization**
   ```javascript
   // External packages first
   const { Core } = require('@adobe/aio-sdk');
   
   // Shared utilities next
   const { response } = require('../../shared/http/response');
   
   // Local imports last
   const { validateInput } = require('./steps/validateInput');
   ```

3. **Path Structure**
   - Use `./` for files in the same directory
   - Use `../` to move up one directory
   - Keep paths as shallow as possible
   - Consider refactoring if paths become too deep

4. **Refactoring Tips**
   - Move commonly used code to shared utilities
   - Keep related files close together
   - Use clear directory names
   - Document complex paths

### Example Usage

```javascript
// HTTP utilities from shared
const { request } = require('../../shared/http/client');
const { headers } = require('../../shared/http/headers');
const { response } = require('../../shared/http/response');

// Local utilities
const { validateInput } = require('./steps/validateInput');
const { buildProducts } = require('./steps/buildProducts');
```

### Client-Side Structure

The frontend uses Vite for building and serving:

```html
<!-- HTML Components -->
<div hx-get="/api/files" hx-trigger="load">
  <!-- Content will be replaced by server response -->
</div>

<!-- Styles -->
<link href="./styles/main.css" rel="stylesheet">

<!-- JavaScript -->
<script src="./js/utils.js"></script>
```

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement server-side actions
   - Create HTML templates
   - Add HTMX attributes
   - Test interactions
   - Submit PR

2. **Testing**
   - Unit tests in `test/`
   - Run `npm test` before commits
   - Test HTMX interactions manually

3. **Code Style**
   - Follow ESLint config
   - Keep imports organized
   - Use consistent path patterns
   - Keep HTML templates clean

4. **Documentation**
   - Update relevant docs
   - Document complex paths
   - Update README if needed

## Best Practices

1. **HTMX Patterns**
   - Use semantic HTML
   - Keep JavaScript minimal
   - Leverage HTMX attributes
   - Return focused HTML fragments
   - Use progressive enhancement

2. **Server-Side Actions**
   - Keep actions focused
   - Use shared utilities
   - Handle errors gracefully
   - Return appropriate responses

3. **Error Handling**
   - Return error HTML fragments
   - Use HTMX error triggers
   - Log errors appropriately
   - Provide user feedback

4. **Performance**
   - Keep dependencies minimal
   - Use appropriate caching
   - Optimize HTML responses
   - Monitor action performance

## Debugging

1. **Local Development**
   ```bash
   aio app run
   ```

2. **HTMX Debugging**
   - Use `htmx.logAll()` in console
   - Check network tab for requests
   - Inspect HTML responses
   - Use HTMX debug attributes

3. **Server-Side Logs**
   - Check Adobe I/O Runtime logs
   - Use `Core.Logger` for actions
   - Monitor HTML response codes

4. **Common Issues**
   See [Troubleshooting Guide](troubleshooting.md)

## Additional Resources

- [Adobe App Builder Docs](https://developer.adobe.com/app-builder/)
- [HTMX Documentation](https://htmx.org/)
- [HTML Best Practices](https://www.w3.org/TR/html-best-practices/) 