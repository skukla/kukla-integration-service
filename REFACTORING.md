# Codebase Restructuring Implementation Plan

## Overview
This document outlines the plan for restructuring the codebase to improve modularity, eliminate duplication, and enhance maintainability.

## Target Structure
```
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
  ```
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
- [ ] 1. Create new commerce directory structure
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

- [ ] 2. Refactor commerce API modules
  - [ ] Create unified Commerce API client using core/http
  - [ ] Extract endpoint definitions to endpoints.js
  - [ ] Move authentication handling to client.js
  - [ ] Use core/monitoring for error handling
  - [ ] Use core/storage/cache for caching
  - [ ] Move batch processing logic to client.js
  - [ ] Create api/index.js entry point

- [ ] 3. Consolidate commerce data
  - [ ] Move product-related constants to data/product.js
  - [ ] Move category-related constants to data/category.js
  - [ ] Move inventory-related constants to data/inventory.js
  - [ ] Use core/data/validation for field validation
  - [ ] Create data/index.js entry point
  - [ ] Document data structures and validation rules

- [ ] 4. Consolidate transformations
  - [ ] Move product transformation logic to transform/product.js
  - [ ] Use core/data/transformation utilities
  - [ ] Use core/monitoring for error handling
  - [ ] Create transform/index.js entry point
  - [ ] Document transformation rules and processes

- [ ] 5. Create commerce entry point
  - [ ] Create commerce/index.js
  - [ ] Export public API for commerce integration
  - [ ] Add module documentation
  - [ ] Add usage examples

- [ ] 6. Move CSV functionality to core
  - [ ] Create core/storage/csv.js for generic CSV operations
  - [ ] Use core/http/compression for compression
  - [ ] Implement memory-efficient generation
  - [ ] Add comprehensive documentation
  - [ ] Keep product-specific CSV transformation in commerce/transform/product.js

- [ ] 7. Update dependent modules
  - [ ] Update get-products action to use new structure
  - [ ] Update browse-files action if needed
  - [ ] Ensure consistent error handling
  - [ ] Remove any duplicate code
  - [ ] Add logging using core/monitoring

### Phase 3: Action Cleanup
- [ ] 1. Clean up get-products action
  - [ ] Remove duplicated cache implementation
  - [ ] Remove duplicated compression implementation
  - [ ] Update to use new commerce modules
  - [ ] Reorganize steps to use new structure

- [ ] 2. Update frontend actions
  - [x] Update browse-files to use new core modules
    > Completed 2024-03-21: Refactored browse-files to use core storage/files.js and removed redundant HTMX response handling
    > Completed 2024-03-21: Created new htmx/formatting.js for HTMX-specific concerns
    > Completed 2024-03-21: Removed redundant src/htmx/file-responses.js and responses.js
  - [ ] Standardize action structure

### Phase 4: Testing and Validation
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

### Phase 5: Cleanup and Finalization
- [ ] 1. Remove all deprecated/unused code
- [ ] 2. Update README with new architecture
- [ ] 3. Update any deployment scripts
- [ ] 4. Final testing of complete system

### Phase 6: Configuration Consolidation
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