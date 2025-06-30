# Project Overview

> **Adobe Commerce integration service built on Adobe App Builder platform**

## What is Kukla Integration Service?

The Kukla Integration Service is an Adobe App Builder application that provides seamless integration between Adobe Commerce and file management operations. It enables product data export via both REST API and API Mesh (GraphQL), file operations, and provides a modern web interface using HTMX for progressive enhancement.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Adobe I/O Runtime                      │
├─────────────────────────────────────────────────────────────┤
│  Backend Actions          │  Frontend Actions              │
│  ├── get-products/        │  ├── browse-files/             │
│  ├── get-products-mesh/   │  ├── upload-file/              │
│  ├── download-file/       │  └── (HTMX responses)          │
│  └── delete-file/         │                                │
├─────────────────────────────────────────────────────────────┤
│                     Shared Utilities                       │
│  ├── src/commerce/        │  ├── src/htmx/                │
│  ├── src/core/           │  └── config/                   │
├─────────────────────────────────────────────────────────────┤
│               Frontend (HTMX + Progressive Enhancement)    │
│  └── web-src/ (Static assets with HTMX)                   │
├─────────────────────────────────────────────────────────────┤
│                    API Mesh Integration                    │
│  ├── mesh.json            │  └── mesh-resolvers.js         │
│  │  (GraphQL config)      │     (True Mesh pattern)       │
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
- **File Storage**: Adobe I/O Files SDK and AWS S3 for file operations
- **Security**: Adobe I/O authentication and authorization
- **Deployment**: Adobe I/O CLI for staging-first workflow

### **API Integration Stack**

- **REST API**: Traditional Commerce API integration (200+ calls)
- **API Mesh**: GraphQL consolidation using True Mesh pattern (1 call)
- **True Mesh Pattern**: Consolidates 200+ API calls into single GraphQL query
- **Configuration System**: Environment-aware with schema validation

### **Frontend Stack**

- **HTMX**: Progressive enhancement for dynamic UI updates
- **Vanilla JavaScript**: Minimal JavaScript for enhanced UX
- **Modern CSS**: Clean, accessible design system with component library
- **Progressive Enhancement**: Works without JavaScript

### **Integration Layer**

- **Adobe Commerce API**: Product data retrieval and management
- **File Operations**: Upload, download, delete, and browse files
- **Performance Optimization**: Intelligent caching and compression
- **Error Handling**: Comprehensive error handling and logging

## Core Features

### 🛍️ **Product Export**

- **Dual Export Methods**: REST API and API Mesh (GraphQL) integration
- **Perfect Parity**: Identical CSV output from both methods (119 products, ~15KB)
- **Performance**: API Mesh consolidates 200+ calls into 1 GraphQL query
- **Multiple Formats**: JSON and CSV support with configurable options
- **Bulk Operations**: Progress tracking and performance metrics

### 📁 **File Management**

- **Multi-Provider Storage**: Adobe I/O Files (staging) and AWS S3 (production)
- **File Operations**: Upload, browse, download, and delete with HTMX UI
- **Security**: Proper MIME type handling and access controls
- **Performance**: Optimized file transfers with compression

### 🎨 **Modern UI**

- **HTMX-Powered**: Dynamic updates without page refreshes
- **Progressive Enhancement**: Full functionality without JavaScript
- **Design System**: Consistent component library with accessibility
- **Real-Time Feedback**: Toast notifications and loading states

### 🔧 **Developer Experience**

- **True Mesh Pattern**: Consolidates multiple Commerce APIs into unified GraphQL schema
- **Step Functions**: Reusable action components following DRY principles
- **Schema Validation**: Build-time configuration validation
- **Comprehensive Testing**: Action testing with automatic configuration
- **Staging-First Workflow**: Reliable development and deployment

## Development Workflow

### **Staging-First Approach**

```bash
# Quick development iteration
npm start                    # Fast deploy to staging

# Reliable staging deployment
npm run deploy              # Clean build and deploy to staging

# Production deployment
npm run deploy:prod         # Clean build and deploy to production
```

### **Testing Strategy**

```bash
# Test individual actions
npm run test:action get-products      # REST API method
npm run test:action get-products-mesh # API Mesh method

# Performance testing
npm run test:performance

# Schema validation
npm run test:schemas
```

## File Structure

For complete project structure details, see the [**Project Structure Guide**](../architecture/project-structure.md).

```text
kukla-integration-service/
├── 🌐 API Mesh Integration
│   ├── mesh.json                  # API Mesh configuration
│   └── mesh-resolvers.js          # True Mesh Pattern resolvers
├── ⚙️ actions/                    # Adobe I/O Runtime actions
│   ├── backend/                   # API endpoints with step functions
│   └── frontend/                  # HTMX response handlers
├── 🛠️ src/                        # Shared utilities and core logic
│   ├── core/                      # Configuration, HTTP, storage, tracing
│   ├── commerce/                  # Adobe Commerce integration
│   └── htmx/                      # HTMX-specific helpers
├── 🌍 web-src/                    # Frontend assets with HTMX enhancement
├── 📋 config/                     # Environment-aware configuration system
├── 🔧 scripts/                    # Build and testing utilities
└── 📚 docs/                       # Comprehensive documentation
```

## Environment Configuration

The service supports multiple environments with schema-validated configuration:

- **Staging**: Full testing environment with Adobe I/O Files storage
- **Production**: Live environment with AWS S3 storage and monitoring
- **Configuration**: Environment-specific settings with automatic detection
- **Validation**: Build-time schema validation for quality assurance

## Security

- **Adobe I/O Authentication**: Secure API access with proper credential handling
- **Input Validation**: All inputs validated with comprehensive schemas
- **Rate Limiting**: Commerce API rate limit management
- **File Security**: Secure file operations with proper access controls
- **Environment Separation**: Clear boundaries between staging and production

## Performance

### **API Mesh Integration**

- **Consolidation**: 200+ Commerce API calls reduced to 1 GraphQL query
- **True Mesh**: Consolidates 200+ API calls into single GraphQL query
- **Perfect Parity**: Identical output between REST and mesh methods

### **Optimization Features**

- **Intelligent Caching**: Commerce data and file operations
- **Lazy Loading**: Progressive data loading in UI
- **Compression**: Optimized file transfers and responses
- **Performance Monitoring**: Detailed metrics and tracing

## Getting Started

1. **[Development Setup](setup.md)** - Set up your development environment
2. **[Project Structure](../architecture/project-structure.md)** - Understand the codebase organization
3. **[Architecture Deep Dive](../architecture/adobe-app-builder.md)** - Understand the platform

## Integration Patterns

### **API Mesh with True Mesh Pattern**

- **[API Mesh Integration](../development/api-mesh-integration.md)** - Complete implementation guide
- **[True Mesh Pattern](../architecture/true-mesh-pattern.md)** - Architecture and benefits
- **Performance**: Single GraphQL query replaces 200+ REST calls
- **Architecture**: Embedded resolvers consolidate data from multiple Commerce APIs

### **Configuration System**

- **[Configuration Guide](../development/configuration.md)** - Environment-aware configuration
- **[Schema Validation](../development/schemas.md)** - Build-time quality assurance
- **Security**: Backend vs frontend configuration boundaries

## Related Documentation

### **Architecture Guides**

- **[Adobe App Builder Platform](../architecture/adobe-app-builder.md)** - Platform overview and patterns
- **[HTMX Integration](../architecture/htmx-integration.md)** - Frontend architecture
- **[True Mesh Pattern](../architecture/true-mesh-pattern.md)** - API Mesh integration pattern
- **[Project Structure](../architecture/project-structure.md)** - Complete file organization
- **[Commerce Integration](../architecture/commerce-integration.md)** - API integration patterns

### **Development Guides**

- **[Coding Standards](../development/coding-standards.md)** - Code quality guidelines
- **[Frontend Development](../development/frontend.md)** - HTMX and UI patterns
- **[Configuration System](../development/configuration.md)** - Environment configuration
- **[Testing Guide](../development/testing.md)** - Testing strategies and tools

---

_This overview provides a high-level understanding of the project including our latest API Mesh integration and True Mesh pattern. For detailed implementation guides, see the specific documentation sections._
