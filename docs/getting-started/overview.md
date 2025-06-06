# Project Overview

> **Adobe Commerce integration service built on Adobe App Builder platform**

## What is Kukla Integration Service?

The Kukla Integration Service is an Adobe App Builder application that provides seamless integration between Adobe Commerce and file management operations. It enables product data export, file operations, and provides a modern web interface using HTMX for progressive enhancement.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Adobe I/O Runtime                      │
├─────────────────────────────────────────────────────────────┤
│  Backend Actions          │  Frontend Actions              │
│  ├── get-products/        │  ├── browse-files/             │
│  ├── download-file/       │  └── (HTMX responses)          │
│  └── delete-file/         │                                │
├─────────────────────────────────────────────────────────────┤
│                     Shared Utilities                       │
│  ├── src/commerce/        │  ├── src/htmx/                │
│  ├── src/core/           │  └── config/                   │
├─────────────────────────────────────────────────────────────┤
│               Frontend (HTMX + Progressive Enhancement)    │
│  └── web-src/ (Static assets with HTMX)                   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Adobe Commerce     │
                    │   (Product Data)      │
                    └───────────────────────┘
```

## Key Technologies

### **Adobe App Builder Platform**

- **Serverless Functions**: Adobe I/O Runtime actions for backend logic
- **File Storage**: Adobe I/O Files SDK for file operations
- **Security**: Adobe I/O authentication and authorization
- **Deployment**: Adobe I/O CLI for staging-first workflow

### **Frontend Stack**

- **HTMX**: Progressive enhancement for dynamic UI updates
- **Vanilla JavaScript**: Minimal JavaScript for enhanced UX
- **Modern CSS**: Clean, accessible design system
- **Progressive Enhancement**: Works without JavaScript

### **Integration Layer**

- **Adobe Commerce API**: Product data retrieval and management
- **File Operations**: Upload, download, delete, and browse files
- **Caching**: Intelligent caching for performance optimization
- **Error Handling**: Comprehensive error handling and logging

## Core Features

### 🛍️ **Product Export**

- Export product data from Adobe Commerce
- Multiple format support (JSON, CSV)
- Bulk operations with progress tracking
- Caching for performance optimization

### 📁 **File Management**

- Upload files to Adobe I/O Files storage
- Browse files with pagination and filtering
- Download files with proper MIME type handling
- Delete files with confirmation workflows

### 🎨 **Modern UI**

- HTMX-powered dynamic updates
- Progressive enhancement (works without JS)
- Responsive design with accessible patterns
- Real-time feedback and notifications

### 🔧 **Developer Experience**

- Comprehensive error handling and logging
- Performance monitoring and optimization
- Staging-first development workflow
- Automated testing and validation

## Development Workflow

### **Staging-First Approach**

```bash
# Quick development iteration
npm start

# Reliable staging deployment
npm run deploy

# Production deployment
npm run deploy:prod
```

### **Testing Strategy**

```bash
# Test individual actions
npm run test:action -- actions/backend/get-products

# Performance testing
npm run perf:test

# Integration testing
npm run test:integration
```

## File Structure

```
kukla-integration-service/
├── actions/                 # Adobe I/O Runtime actions
│   ├── backend/            # API endpoints and data processing
│   └── frontend/           # HTMX response handlers
├── src/                    # Shared utilities and core logic
│   ├── core/              # Common utilities
│   ├── htmx/              # HTMX-specific helpers
│   └── commerce/          # Adobe Commerce integration
├── web-src/               # Frontend static assets
├── config/                # Environment and schema configurations
└── docs/                  # Comprehensive documentation
```

## Environment Configuration

The service supports multiple environments with schema-validated configuration:

- **Development**: Local testing with staging backend
- **Staging**: Full testing environment
- **Production**: Live environment with monitoring

## Security

- **Adobe I/O Authentication**: Secure API access
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Commerce API rate limit management
- **File Security**: Secure file upload and access patterns

## Performance

- **Caching Strategy**: Redis-based caching for Commerce data
- **Lazy Loading**: Progressive data loading in UI
- **Compression**: Optimized file transfers
- **CDN Integration**: Static asset optimization

## Getting Started

1. **[Development Setup](setup.md)** - Set up your development environment
2. **[Deployment Guide](deployment.md)** - Deploy your first changes
3. **[Architecture Deep Dive](../architecture/adobe-app-builder.md)** - Understand the platform

## Related Documentation

- **[Adobe App Builder Platform](../architecture/adobe-app-builder.md)** - Platform overview and patterns
- **[HTMX Integration](../architecture/htmx-integration.md)** - Frontend architecture
- **[Commerce Integration](../architecture/commerce-integration.md)** - API integration patterns
- **[Coding Standards](../development/coding-standards.md)** - Code quality guidelines

---

_This overview provides a high-level understanding of the project. For detailed implementation guides, see the specific documentation sections._
