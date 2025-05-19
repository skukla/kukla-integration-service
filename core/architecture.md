# Architecture Overview

[← Back to README](../README.md)

## Core Principles

Our architecture follows these key principles:
- Simple, focused components
- Clear separation of concerns
- Practical performance optimization
- Easy maintenance
- Consistent patterns

## System Components

### Backend (actions/)

```
actions/
├── core/                      # Core utilities
│   ├── http.js               # HTTP client and response handling
│   ├── cache.js              # Caching utilities and strategies
│   ├── files.js              # File operations and validation
│   ├── errors.js             # Error types and handling
│   ├── validation.js         # Input validation utilities
│   └── performance.js        # Performance monitoring
├── commerce/                 # Commerce integration
│   ├── integration.js        # Adobe Commerce API integration
│   └── auth.js              # Commerce authentication
├── htmx/                    # HTMX utilities
│   └── responses.js         # HTMX response formatting
├── frontend/                # UI-related actions
│   └── browse-files/        # File browser handlers
└── backend/                 # Data processing actions
    ├── get-products/        # Product data retrieval
    ├── download-file/       # File download handling
    └── delete-file/         # File deletion operations
```

#### Core Layer
- **HTTP Module** (`core/http.js`)
  - Standardized API communication
  - Response handling patterns
  - Request formatting
  - Error handling integration

- **Cache Module** (`core/cache.js`)
  - Response caching strategies
  - Cache invalidation
  - Performance optimization
  - Resource management

- **Files Module** (`core/files.js`)
  - Secure file operations
  - Path validation
  - Metadata handling
  - Storage integration

- **Error Module** (`core/errors.js`)
  - Error type definitions
  - Error handling patterns
  - Debug context management
  - Retry capability handling

- **Validation Module** (`core/validation.js`)
  - Input validation rules
  - Data sanitization
  - Type checking
  - Security validation

- **Performance Module** (`core/performance.js`)
  - Performance metrics
  - Resource monitoring
  - Optimization utilities
  - Load management

#### Commerce Layer
- **Integration Module** (`commerce/integration.js`)
  - Adobe Commerce API integration
  - Product data management
  - API response handling
  - Error recovery

- **Auth Module** (`commerce/auth.js`)
  - Secure credential handling
  - Token management
  - Authentication flows
  - Session handling

#### HTMX Layer
- **Response Module** (`htmx/responses.js`)
  - Dynamic UI updates
  - Response formatting
  - Loading state management
  - Error presentation

### Frontend (web-src/)

```
web-src/src/js/
├── core/                     # Core utilities
│   ├── http.js              # HTTP client handling
│   ├── urls.js              # URL management
│   ├── notifications.js     # Notification system
│   ├── modal.js             # Modal management
│   ├── downloads.js         # Download handling
│   ├── loading.js          # Loading state management
│   └── error-handler.js    # Error handling utilities
├── htmx/                    # HTMX integration
│   ├── config.js            # HTMX configuration
│   └── events.js            # Event handling
├── browser/                 # UI components
│   └── file-browser.js      # File browser component
└── main.js                  # Application entry point

web-src/src/styles/design-system/
└── components/             # Component styles
    ├── notifications.css   # Notification system styles
    ├── table.css          # Table component styles
    ├── buttons.css        # Button styles
    ├── loading.css        # Loading indicators
    ├── modal.css          # Modal styles
    └── typography.css     # Typography styles
```

#### Core Features
- **HTTP Module** (`core/http.js`)
  - API communication
  - Request formatting
  - Response handling
  - Error management

- **URL Module** (`core/urls.js`)
  - Centralized URL construction
  - Action-based routing
  - Commerce API URL handling
  - Clean separation between frontend and Commerce URLs

- **Notifications** (`core/notifications.js`)
  - User notifications
  - Toast messages
  - Status updates
  - Error presentation
  - Type-specific styling (success, error, warning, info)
  - Accessibility support
  - Animation handling

- **Modal System** (`core/modal.js`)
  - Modal management
  - Focus handling
  - Accessibility features
  - Event coordination

- **Download System** (`core/downloads.js`)
  - Base64 response processing
  - File download handling
  - Download status notifications
  - Error handling for downloads
  - HTMX integration for download events

- **Loading States** (`core/loading.js`)
  - Loading indicator management
  - State transitions
  - HTMX loading integration
  - Progress feedback

- **Error Handler** (`core/error-handler.js`)
  - Centralized error processing
  - Error type management
  - User-friendly error messages
  - Error recovery options

#### Design System Components
- **Notifications** (`components/notifications.css`)
  - Toast notification styling
  - Type-specific themes
  - Animation and transitions
  - Responsive design
  - Accessibility styles

#### HTMX Integration
- **Configuration** (`htmx/config.js`)
  - HTMX settings
  - Security configuration
  - Event bindings
  - Extension setup

- **Event Handling** (`htmx/events.js`)
  - Event listeners
  - Response processing
  - State management
  - Error handling

#### Browser Components
- **File Browser** (`browser/file-browser.js`)
  - File listing
  - Upload handling
  - Download management
  - UI interactions

## Workflow Patterns

### Product Management
The product management workflow follows a simple, efficient pattern:

1. **Request Handling**
   - Frontend sends requests through `core/http.js`
   - HTMX triggers appropriate backend actions
   - Validation occurs in `core/validation.js`

2. **Commerce Integration**
   - `commerce/integration.js` handles Adobe Commerce API calls
   - Authentication managed by `commerce/auth.js`
   - Response caching via `core/cache.js`

3. **Response Processing**
   - Error handling through `core/errors.js`
   - HTMX responses formatted by `htmx/responses.js`
   - UI updates via HTMX events

### File Operations
File operations follow a secure, validated flow:

1. **Request Processing**
   - File requests validated by `core/validation.js`
   - Security checks in `core/files.js`
   - Path validation and sanitization

2. **Storage Operations**
   - Secure file handling in `core/files.js`
   - Metadata management and validation
   - Performance optimization via `core/performance.js`

3. **User Feedback**
   - Status updates through `core/notifications.js`
   - Progress indicators via HTMX
   - Error presentation using modal system

## Documentation Structure

```
docs/
├── core/                    # Core architecture and development
│   ├── architecture.md     # System design and patterns
│   ├── development.md      # Development workflow
│   ├── security.md         # Security guidelines
│   └── deployment.md       # Deployment procedures
├── frontend/               # Frontend documentation
├── backend/                # Backend API and services
├── process/                # Development processes
├── project/                # Project-specific docs
├── README.md               # Main entry point
└── testing-verification.md # Testing guidelines
```

Each directory serves a specific purpose:
- **core/** - Core system documentation, architecture, and development guides
- **frontend/** - Frontend-specific documentation and component guides
- **backend/** - Backend services, API documentation, and integration guides
- **process/** - Development processes, workflows, and procedures
- **project/** - Project-specific documentation and requirements

## Security Model

- Adobe App Builder authentication
- Secure file operations
- Input validation
- Error boundaries
- Access control

## Performance

- Response caching
- Compression for large payloads
- Progressive loading
- Resource optimization

## Error Handling

- Type-specific errors
- Clear user feedback
- Debug context
- Retry capabilities

For detailed implementation guides, see:
- [Development Guide](development.md)
- [API Reference](api-reference.md)
- [Error Handling](error-handling.md)
- [Performance Guide](performance.md) 