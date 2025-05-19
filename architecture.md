# Architecture Guide

[← Back to README](../README.md) | Documentation: Architecture

---

## Overview

This application follows a clear separation between client-side and server-side code, using Adobe App Builder's serverless architecture.

## Detailed Directory Structure

```plaintext
kukla-integration-service/
├── actions/                                  # Server-side code
│   ├── backend/
│   │   ├── get-products/                     # Product export functionality
│   │   │   ├── lib/                          # Core libraries
│   │   │   │   ├── api/                      # API integration
│   │   │   │   └── product-transformer.js    # Data transformation
│   │   │   ├── steps/                        # Processing steps
│   │   │   └── index.js                      # Main handler
│   │   └── download-file/                    # File download handling
│   ├── frontend/
│   │   └── browse-files/                     # File browsing interface
│   │       ├── utils/                        # UI utilities
│   │       │   ├── file/                     # File-related utilities
│   │       │   └── ui/                       # UI helpers
│   │       ├── templates.js                  # HTML templates
│   │       └── index.js                      # Main handler
│   └── shared/                               # Common utilities
│       ├── http/                             # HTTP utilities
│       ├── file/                             # File operations
│       ├── validation/                       # Input validation
│       └── commerce/                         # Commerce utilities
├── web-src/                                  # Client-side code
│   ├── index.html                            # Main HTML template
│   └── src/
│       ├── styles/                           # Style organization
│       │   ├── components/                   # Component-specific styles
│       │   └── design-system/                # Design system styles
│       └── js/                               # JavaScript code
│           ├── main.js                       # Main entry point
│           └── utils/                        # Utility functions
├── docs/                                     # Documentation
└── test/                                     # Test files
```

## Application Components

### Client-Side Code (`/web-src`)

- Browser-executed code
- HTMX-powered dynamic UI updates
- Minimal JavaScript for enhanced interactions
- Built with Vite

### Server-Side Actions (`/actions`)

#### Frontend Actions (`/actions/frontend`)

- Server-side actions supporting UI functionality
- Generate dynamic HTML responses for HTMX
- Handle file operations for UI
- Bridge between client and backend services
- Return HTML fragments for dynamic updates

#### Backend Actions (`/actions/backend`)

- Core business logic and data processing
- Adobe Commerce integration
- Data transformation
- Authentication/authorization

#### Shared Utilities (`/actions/shared`)

- Common code used across actions
- HTTP utilities
- Validation helpers
- File operations

## Technologies Used

- **Adobe App Builder**: Serverless actions and File Store
- **Node.js**: Backend logic and API integration
- **HTMX**: Dynamic UI updates without complex JavaScript
- **Vite**: Frontend build tool
- **Adobe Commerce**: Product data source

## Data Flow

1. **Product Export Flow**
   - User clicks export button (HTMX request)
   - Frontend action validates request
   - Backend action fetches and processes data
   - Files stored in Adobe App Builder File Store
   - HTML fragment returned to update UI

2. **File Management Flow**
   - UI displays available files
   - HTMX requests handle file operations
   - Frontend actions return HTML fragments
   - Dynamic page updates without page reload

## Frontend Architecture

Our frontend uses a hypermedia-driven approach with HTMX:
- Server returns HTML instead of JSON
- UI updates happen through HTML fragment swaps
- Minimal client-side JavaScript
- Progressive enhancement where needed

Benefits of this approach:
- Simpler architecture (no complex state management)
- Faster development cycles
- Better performance (smaller payload size)
- Improved maintainability

## Security Architecture

- Environment-based configuration
- Secure credential management
- Adobe App Builder authentication
- File access control

For more details about security practices, see the [Security Guide](security.md).

## Build Configuration

The project uses Vite for frontend builds and Adobe App Builder's built-in build process for actions:

```plaintext
/
├── vite.config.js       # Frontend build configuration
└── app.config.yaml      # Adobe App Builder configuration
```

This structure provides:
- Simple, standard configuration
- Fast builds with Vite
- Native Adobe App Builder support
- Clear separation of concerns 