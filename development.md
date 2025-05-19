# Development Guide

[← Back to README](../README.md) | Documentation: Development

---

## Overview

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
# Build
npm run build         # Build with Vite
npm run clean        # Clean dist directory

# Deploy
npm run deploy:full  # Deploy everything
npm run deploy:web   # Deploy web assets only

# Development
npm run test        # Run tests
npm run lint        # Check code style
```

## Import Aliases

### Server-Side Aliases
```javascript
// Instead of
const { headers } = require('../../../../shared/http/headers');

// Use
const { headers } = require('@shared/http/headers');
```

Available aliases:
- `@shared/*` - Shared utilities
- `@frontend-actions/*` - Frontend actions
- `@backend-actions/*` - Backend actions

### Client-Side Structure
```html
<!-- HTML Components -->
<div hx-get="/api/files" hx-trigger="load">
  <!-- Content will be replaced by server response -->
</div>

<!-- Styles -->
<link href="@styles/main.css" rel="stylesheet">

<!-- JavaScript Enhancements -->
<script src="@js/utils.js"></script>
```

Available aliases:
- `@/*` - Source root
- `@html/*` - HTML components
- `@styles/*` - Styles
- `@js/*` - JavaScript utilities

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
   - E2E tests in `e2e/`
   - Manual testing guide in [Testing Guide](testing.md)

3. **Code Style**
   - Follow ESLint config
   - Run `npm run lint` before commits
   - Keep HTML templates clean and semantic

4. **Documentation**
   - Update relevant docs
   - Document HTMX patterns used
   - Update README if needed

## Best Practices

1. **HTMX Patterns**
   - Use semantic HTML
   - Keep JavaScript minimal
   - Leverage HTMX attributes for behavior
   - Return focused HTML fragments
   - Use progressive enhancement

2. **Server-Side Templates**
   - Keep templates focused
   - Use partials for reuse
   - Return minimal HTML
   - Include required HTMX attributes

3. **Error Handling**
   - Return error HTML fragments
   - Use HTMX error triggers
   - Include user feedback
   - Log server-side errors

4. **Security**
   - Validate all inputs
   - Sanitize HTML output
   - Use CSRF protection
   - Follow [Security Guide](security.md)

5. **Performance**
   - Minimize HTML payload size
   - Use efficient selectors
   - Cache when appropriate
   - Optimize image assets

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