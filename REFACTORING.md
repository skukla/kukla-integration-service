# Codebase Restructuring Implementation Plan

## Overview

This document outlines the plan for restructuring the codebase to improve modularity, eliminate duplication, and enhance maintainability.

## Target Structure

```text
src/
├── core/
│   ├── config/
│   │   └── index.js
│   ├── http/
│   │   ├── compression.js
│   │   ├── client.js
│   │   └── index.js
│   ├── data/
│   │   ├── validation.js
│   │   ├── transformation.js
│   │   └── index.js
│   ├── storage/
│   │   ├── files.js
│   │   ├── cache.js
│   │   └── index.js
│   └── monitoring/
│       ├── performance.js
│       ├── errors.js
│       └── index.js
├── htmx/
│   └── formatting.js
├── commerce/
│   ├── api/
│   │   ├── client.js
│   │   └── endpoints.js
│   ├── data/
│   │   ├── product.js
│   │   ├── category.js
│   │   └── inventory.js
│   └── transform/
│       └── product.js
```

## Implementation Phases

### Phase 1: Core Module Reorganization

- [x] 1. Create new core directory structure

    ```text
    src/core/
    ├── config/
    ├── http/
    ├── data/
    ├── storage/
    ├── monitoring/
    └── index.js            (Core module entry point)
    ```

    > Completed 2024-03-19: Created initial directory structure for core modules
    > Updated 2024-03-20: Added config directory for app-specific configuration

- [x] 2. Move and refactor HTTP-related modules
    - [x] Move `compression.js` → `http/compression.js`
        > Completed 2024-03-19: Moved compression.js and updated imports in integration.js and responses.js
    - [x] Extract HTTP client from `http.js` → `http/client.js`
        > Completed 2024-03-19: Extracted client functionality and updated imports in affected files
    - [x] Create domain-specific entry points
        > Completed 2024-03-20: Created index.js files for each core domain (http, storage, monitoring, config)
        > Updated 2024-03-20: Added data/index.js to complete domain-specific entry points
    - [x] Update imports in all dependent files
        > Completed 2024-03-20: Updated all imports to use new domain-specific entry points

- [x] 3. Move and refactor data handling modules
  - [x] Move `validation.js` → `data/validation.js`
    > Completed 2024-03-19: Moved validation.js and updated imports in all dependent files
  - [x] Create `data/transformation.js` from common transform patterns
    > Completed 2024-03-19: Created transformation.js with common utilities and updated imports in affected files
  - [x] Create unified data module entry point
    > Completed 2024-03-20: Created data/index.js to expose validation and transformation utilities

- [x] 4. Move and refactor storage modules
  - [x] Move `files.js` → `storage/files.js`
    > Completed 2024-03-19: Moved files.js and updated imports in all dependent files
  - [x] Create unified `storage/cache.js` for all caching concerns
    > Completed 2024-03-20: Created consolidated cache.js that handles both HTTP and memory caching. Removed separate HTTP cache implementation for better cohesion.
  - [x] Update imports in all dependent files
    > Completed 2024-03-20: Updated all imports to use new unified cache module in storage/

- [x] 5. Move and refactor monitoring modules
  - [x] Move `errors.js` → `monitoring/errors.js`
  - [x] Move `performance.js` → `monitoring/performance.js`
  - [x] Update imports in all dependent files
    > Completed 2024-03-19: Moved error and performance monitoring to dedicated modules and updated all imports

- [x] 6. Create core entry point
  - [x] Create core/index.js to export all core modules
  - [x] Document core module public API
  - [x] Add usage examples
  - [x] Update imports to use new entry point
    > Completed 2024-03-20: Created centralized core entry point with public API exports, added documentation and examples, updated all imports to use the new pattern, and cleaned up unused imports across the codebase

### Phase 2: Commerce Integration Restructuring

- [x] 1. Create new commerce directory structure

  ```
  src/commerce/
  ├── api/
  │   ├── client.js        (Commerce API client using core/http)
  │   ├── endpoints.js     (Commerce API endpoint definitions)
  │   └── index.js        (API module entry point)
  ├── data/
  │   ├── product.js       (Product data and validation)
  │   ├── category.js      (Category data and validation)
  │   ├── inventory.js     (Inventory data and validation)
  │   └── index.js        (Data module entry point)
  ├── transform/
  │   ├── product.js       (Product transformations)
  │   └── index.js        (Transform module entry point)
  └── index.js            (Commerce module entry point)
  ```

    > Completed 2024-03-20: Created initial directory structure and implemented API and data modules

- [x] 2. Refactor commerce API modules
  - [x] Create unified Commerce API client using core/http
  - [x] Extract endpoint definitions to endpoints.js
  - [x] Move authentication handling to client.js
  - [x] Use core/monitoring for error handling
  - [x] Use core/storage/cache for caching
  - [x] Move batch processing logic to client.js
  - [x] Create api/index.js entry point
    > Completed 2024-03-20: Created API module with client, endpoints, and proper integration with core modules

- [x] 3. Consolidate commerce data
  - [x] Move product-related constants to data/product.js
  - [x] Move category-related constants to data/category.js
  - [x] Move inventory-related constants to data/inventory.js
  - [x] Use core/data/validation for field validation
  - [x] Create data/index.js entry point
  - [x] Document data structures and validation rules
    > Completed 2024-03-20: Created data modules with validation, type definitions, and utilities

- [x] 4. Consolidate transformations
  - [x] Move product transformation logic to transform/product.js
  - [x] Use core/data/transformation utilities
  - [x] Use core/monitoring for error handling
  - [x] Create transform/index.js entry point
  - [x] Document transformation rules and processes
    > Completed 2024-03-21: Consolidated all product transformation logic into transform/product.js, created transform/index.js, and updated all dependent modules

- [x] 5. Create commerce entry point
  - [x] Create commerce/index.js
  - [x] Export public API for commerce integration
  - [x] Add module documentation
  - [x] Add usage examples
    > Completed 2024-03-21: Created main commerce module entry point that exports API, data, and transform modules

- [x] 6. Move CSV functionality to core
  - [x] Create core/storage/csv.js for generic CSV operations
  - [x] Use core/http/compression for compression
  - [x] Implement memory-efficient generation
  - [x] Add comprehensive documentation
  - [x] Keep product-specific CSV transformation in commerce/transform/product.js
    > Completed 2024-03-21: Created generic CSV module in core/storage/csv.js with streaming support, memory optimization, and compression integration. Updated get-products action to use the new module.

- [x] 7. Update dependent modules
  - [x] Update get-products action to use new structure
  - [x] Update browse-files action if needed
  - [x] Ensure consistent error handling
  - [x] Remove any duplicate code
  - [x] Add logging using core/monitoring
    > Completed 2024-03-21: Updated get-products action to use new core CSV and storage modules, removed duplicate code, and ensured consistent error handling across modules.

### Phase 3: Action Cleanup

- [x] 1. Clean up get-products action
  - [x] Remove duplicated cache implementation
    > Completed 2024-03-22: Removed local cache implementation in favor of core cache module
  - [x] Remove duplicated compression implementation
    > Completed 2024-03-22: Removed local compression code and using core compression module
  - [x] Update to use new commerce modules
    > Completed 2024-03-22: Updated to use new commerce API organization
  - [x] Reorganize steps to use new structure
    > Completed 2024-03-22: Restructured steps to use core modules properly

- [x] 2. Update frontend actions
  - [x] Update browse-files to use new core modules
    > Completed 2024-03-21: Refactored browse-files to use core storage/files.js and removed redundant HTMX response handling
    > Completed 2024-03-21: Created new htmx/formatting.js for HTMX-specific concerns
    > Completed 2024-03-21: Removed redundant src/htmx/file-responses.js and responses.js
  - [x] Standardize action structure
    > Completed 2024-03-22: Updated action structure to follow consistent patterns

- [x] 3. Commerce API Reorganization
  - [x] Move integration.js into api/ directory
    > Completed 2024-03-22: Moved commerce integration code into proper api/ structure
  - [x] Extract shared configuration
    > Completed 2024-03-22: Created api/config.js for centralized commerce configuration
  - [x] Separate client and integration concerns
    > Completed 2024-03-22: Split functionality between client.js (core API) and integration.js (commerce-specific)
  - [x] Update all imports
    > Completed 2024-03-22: Updated all imports to use new module structure
  - [x] Remove duplicate code
    > Completed 2024-03-22: Removed duplicate URL building and request handling code

### Phase 4: Configuration Consolidation

- [ ] 1. Audit current configuration
  - [ ] Map all configuration files and their purposes
  - [ ] Identify configuration duplication
  - [ ] Document environment-specific configuration needs
  - [ ] Review App Builder configuration requirements

- [ ] 2. Design consolidated configuration
  - [ ] Plan unified configuration structure in root config/
  - [ ] Define environment configuration strategy
  - [ ] Design configuration validation approach
  - [ ] Plan migration path for existing configuration

- [ ] 3. Implement configuration changes
  - [ ] Remove src/core/config
  - [ ] Consolidate all configuration into root config/
  - [ ] Update all configuration imports
  - [ ] Add configuration validation
  - [ ] Update environment handling

- [ ] 4. Update documentation
  - [ ] Document new configuration structure
  - [ ] Update environment setup instructions
  - [ ] Add configuration management guidelines
  - [ ] Document configuration best practices

- [ ] 5. URL Configuration Consolidation
  - [ ] Audit current URL usage
    - [ ] Map all application URLs (frontend routes, API endpoints)
    - [ ] Identify URL patterns across environments
    - [ ] Document URL dependencies in both frontend and backend
    - [ ] Review environment-specific URL requirements
  
  - [ ] 6. Design URL configuration structure
    - [ ] Create unified URL configuration schema
    - [ ] Define environment-specific URL overrides
    - [ ] Plan URL validation strategy
    - [ ] Design URL generation utilities
  
  - [ ] 7. Implement URL configuration
    - [ ] Create config/urls.js for centralized URL management
    - [ ] Implement environment-aware URL resolution

### Phase 5: Code Quality Improvements

- [x] 1. Documentation Linting
  - [x] Fix markdown linting issues in architecture.md
    > Completed 2024-03-25: Fixed spacing, indentation, and formatting issues
  - [x] Fix markdown linting issues in caching.md
    > Completed 2024-03-25: Fixed list indentation and trailing spaces
  - [x] Ensure consistent markdown formatting across docs
    > Completed 2024-03-25: Applied consistent formatting rules across documentation

- [ ] 2. ESLint Configuration
  - [ ] Review and update ESLint rules
  - [ ] Add TypeScript-specific rules
  - [ ] Configure import sorting
  - [ ] Add React-specific rules for web-src
  - [ ] Document linting guidelines

- [ ] 3. Code Style Standardization
  - [ ] Define code formatting standards
  - [ ] Configure Prettier integration
  - [ ] Add pre-commit hooks
  - [ ] Document style guidelines

- [ ] 4. Testing Standards
  - [ ] Define testing patterns
  - [ ] Configure Jest properly
  - [ ] Add test coverage requirements
  - [ ] Document testing guidelines

### Phase 6: Testing and Validation

- [ ] 1. API Testing
  - [ ] Execute API tests using scripts/test-api.js
  - [ ] Verify all API endpoints return expected responses
  - [ ] Test error handling and edge cases
  - [ ] Validate response formats and headers

- [ ] 2. Performance Testing
  - [ ] Run performance tests from tests/performance
  - [ ] Compare metrics against baseline
  - [ ] Verify no performance regressions
  - [ ] Document any performance improvements

- [ ] 3. Integration Testing
  - [ ] Test commerce API integration
  - [ ] Test file operations
  - [ ] Test caching behavior
  - [ ] Test compression functionality

### Phase 6: Cleanup and Finalization

- [ ] 1. Remove all deprecated/unused code
- [ ] 2. Update README with new architecture
- [ ] 3. Update any deployment scripts
- [ ] 4. Final testing of complete system

## Progress Tracking

For each completed item:

1. Mark the checkbox with an 'x': `[x]`
2. Add a comment with:
   - Completion date
   - Any notable changes or deviations
   - Any follow-up tasks identified

## Notes

- Each phase should maintain a working system
- Tests should pass after each step
- Document any deviations from the plan
- Update this document as needed during implementation 