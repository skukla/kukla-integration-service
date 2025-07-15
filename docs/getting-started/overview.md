# Adobe App Builder - Kukla Integration Service Overview

This document provides a comprehensive overview of the Kukla Integration Service, an Adobe App Builder application that integrates with Adobe Commerce and API Mesh using the JsonSchema sources pattern.

## Quick Start

### **Project Structure at a Glance**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Adobe App Builder                                   │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  REST API Export    │  │  API Mesh Export    │  │  File Operations    │  │
│  │  (get-products)     │  │  (get-products-mesh │  │  (browse/download)  │  │
│  │                     │  │   JsonSchema)       │  │                     │  │
│  ├── mesh.json            │  └── mesh.config.js             │  └── HTMX Interface      │  │
│  │  (GraphQL config)      │     (JsonSchema sources)       │     (Dynamic UI)        │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Key Features**

- **Dual Export Methods**: REST API (compatibility) and API Mesh (performance)
- **API Mesh**: GraphQL consolidation using JsonSchema sources pattern (1 call)
- **JsonSchema Sources Pattern**: Consolidates 200+ API calls into single GraphQL query
- **File Management**: Browse, download, and delete exported files
- **HTMX Frontend**: Progressive enhancement with zero-JavaScript fallback
- **Staging-First**: Development workflow with production deployment

### **Performance Comparison**

| Method | API Calls | Performance | Use Case |
|--------|-----------|-------------|----------|
| **REST API** | 200+ calls | ~6-8 seconds | Legacy compatibility |
| **JsonSchema Sources** | 1 GraphQL call | ~1-2 seconds | Optimal performance |

### **Core Architecture**

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Project Architecture                                │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │     Actions         │  │       Core          │  │     Frontend        │  │
│  │  (Adobe I/O Runtime │  │   (src/utilities)   │  │   (web-src/HTMX)    │  │
│  │   serverless)       │  │                     │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Configuration     │  │     Commerce        │  │     File Storage    │  │
│  │  (Environment-aware │  │   (API Integration) │  │   (Adobe I/O Files  │  │
│  │   with validation)  │  │                     │  │    or AWS S3)      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **JsonSchema Sources Pattern**

The API Mesh integration uses the JsonSchema sources pattern:

- **JsonSchema Sources**: Consolidates multiple Commerce APIs into unified GraphQL schema
- **Admin Token Authentication**: Simplified authentication for all Commerce APIs
- **Declarative Configuration**: Schema-driven approach with JSON Schema files
- **Configuration Integration**: Environment-aware with automatic pagination settings

### **Development Commands**

```bash
# Start development
npm run start                       # Quick deployment to staging

# Testing
npm run test:action get-products    # Test REST API export
npm run test:action get-products-mesh # Test JsonSchema sources export

# Deployment
npm run deploy                      # Deploy to staging
npm run deploy:prod                 # Deploy to production
```

### **Project Structure**

```text
kukla-integration-service/
├── 🌐 API Mesh Integration
│   ├── mesh.json                  # API Mesh configuration (generated)
│   ├── mesh.config.js             # Mesh configuration source (JsonSchema)
│   └── src/mesh/schema/           # JSON Schema response definitions
├── ⚙️ actions/                    # Adobe I/O Runtime serverless functions
│   ├── get-products/              # REST API product export
│   ├── get-products-mesh/         # API Mesh product export (JsonSchema)
│   ├── download-file/             # File download operations
│   ├── delete-file/               # File deletion operations
│   └── browse-files/              # HTMX file browser interface
├── 🛠️ src/                        # Shared utilities and core logic
│   ├── core/                      # Configuration, HTTP, storage, tracing
│   ├── htmx/                      # HTMX helpers and response utilities
│   └── commerce/                  # Adobe Commerce integration utilities
├── 🌍 web-src/                    # Frontend assets with HTMX enhancement
├── 📋 config/                     # Environment-aware configuration system
├── 🔧 scripts/                    # Build and testing utilities
└── 📚 docs/                       # This comprehensive documentation
```

## Export Methods Comparison

### **REST API Export (`get-products`)**

Traditional sequential API approach:

```bash
npm run test:action get-products
```

**Process:**

1. Fetch products from Commerce API (paginated)
2. Fetch inventory for each product SKU
3. Fetch category details for each category ID
4. Transform and consolidate data
5. Generate CSV file

**Characteristics:**

- 200+ API calls
- Sequential processing
- Full compatibility
- 6-8 seconds execution time

### **JsonSchema Sources Export (`get-products-mesh`)**

Modern GraphQL consolidation approach:

```bash
npm run test:action get-products-mesh
```

**Process:**

1. Single GraphQL query to API Mesh
2. Mesh consolidates data from multiple Commerce APIs
3. Transform consolidated data
4. Generate CSV file

**Characteristics:**

- 1 GraphQL call
- Consolidated data retrieval
- JsonSchema sources: Consolidates 200+ API calls into single GraphQL query
- 1-2 seconds execution time

## Configuration System

### **Environment-Aware Configuration**

```javascript
// Configuration loads from config/environments/staging.js or production.js
const config = loadConfig();

// Commerce API settings
config.commerce.baseUrl           // Environment-specific Commerce URL
config.commerce.api.timeout       // API timeout settings
config.products.pagination.pageSize // Product pagination settings

// Mesh configuration
config.mesh.endpoint              // API Mesh GraphQL endpoint
config.mesh.apiKey               // API Mesh authentication key
```

### **Credential Management**

```bash
# .env file (never committed)
COMMERCE_ADMIN_TOKEN=your_admin_token_here
MESH_API_KEY=your_mesh_api_key_here

# app.config.yaml inputs
COMMERCE_ADMIN_TOKEN: $COMMERCE_ADMIN_TOKEN
MESH_API_KEY: $MESH_API_KEY
```

## Integration Documentation

### **API Mesh Integration**

- **[API Mesh Integration Guide](../development/api-mesh-integration.md)** - Complete JsonSchema sources implementation
- **[JsonSchema Sources Pattern](../architecture/true-mesh-pattern.md)** - Architecture and benefits

### **Development Resources**

- **[Project Structure](../architecture/project-structure.md)** - Comprehensive file organization
- **[Configuration Guide](../development/configuration.md)** - Environment and credential setup
- **[Testing Guide](../development/testing.md)** - Testing strategies and npm scripts
- **[Deployment Guide](../deployment/environments.md)** - Staging and production deployment

### **Core Documentation**

- **[Adobe App Builder Guide](../architecture/adobe-app-builder.md)** - Platform overview and patterns
- **[Commerce Integration](../architecture/commerce-integration.md)** - API integration patterns
- **[JsonSchema Sources Pattern](../architecture/true-mesh-pattern.md)** - API Mesh integration pattern
- **[HTMX Frontend](../architecture/htmx-integration.md)** - Progressive enhancement patterns

## Getting Started Workflow

1. **Environment Setup**: Follow [Setup Guide](setup.md) for complete environment configuration
2. **Test Actions**: Use `npm run test:action` commands to verify functionality
3. **Explore Documentation**: Review architecture and development guides
4. **Deploy**: Use staging-first workflow with `npm run deploy`

---

_This overview provides a high-level understanding of the project including our latest API Mesh integration and JsonSchema sources pattern. For detailed implementation guides, see the specific documentation sections._
