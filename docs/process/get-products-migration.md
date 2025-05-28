# Get Products Action Migration Plan

This document outlines the step-by-step process for migrating the get-products action from the feed implementation to master.

## Overview

The get-products action fetches product data from Adobe Commerce, enriches it with inventory and category data, transforms it into CSV format, and stores the CSV file. This migration will preserve all functionality while ensuring it follows master's structural patterns.

## Current Locations

- Source: `feature/feed-implementation` branch, `actions/get-products/`
- Target: `master` branch, `actions/backend/get-products/`

## Migration Steps

### 1. Initial Setup ✅

- [x] Create new branch from master:

```bash
git checkout master
git checkout -b feature/get-products-clean
```

- [x] Create directory structure:

```tree
actions/backend/get-products/
├── steps/
├── lib/
│   ├── api/
│   ├── csv/
│   └── storage/
└── index.js
```

### 2. Core Files Migration ✅

#### 2.1 API Layer (`lib/api/`) ✅

- [x] `products.js`

  - Migrated product fetching functionality
  - Implemented pagination handling
  - Added inventory data fetching
  - Maintained error handling patterns

- [x] `categories.js`
  - Migrated category API integration
  - Included category data fetching
  - Added category mapping functionality
  - Functions migrated: - `fetchCategory()` - `getCategoryIds()` - `getUniqueCategoryIds()` - `buildCategoryMap()`

#### 2.2 Support Libraries ✅

- [x] `product-transformer.js`

  - Data transformation logic
  - Category data integration
  - Field mapping functionality

- [x] `auth.js`
  - Authentication handling
  - Token management

### 3. Step Implementation ✅

#### 3.1 Input Validation (`steps/validateInput.js`) ✅

- [x] Required parameters:
  - COMMERCE_URL
  - COMMERCE_ADMIN_USERNAME
  - COMMERCE_ADMIN_PASSWORD
- [x] Optional parameters:
  - include_inventory
  - include_categories

#### 3.2 Product Fetching (`steps/fetchAndEnrichProducts.js`) ✅

- [x] Base product data retrieval
- [x] Inventory enrichment
- [x] Category data enrichment
- [x] Error handling
- [x] Performance monitoring

#### 3.3 Product Building (`steps/buildProducts.js`) ✅

- [x] Product data transformation
- [x] Category data integration
- [x] Data structure preparation for CSV

#### 3.4 CSV Creation (`steps/createCsv.js`) ✅

- [x] CSV format definition
- [x] Field mapping
- [x] Category column handling
- [x] Data transformation

#### 3.5 Storage (`steps/storeCsv.js`) ✅

- [x] File storage implementation
- [x] Error handling
- [x] Success response formatting

### 4. Get-Products Action Completion 🔄

#### 4.1 Review and Update index.js

- [ ] Compare implementations between branches
- [ ] Update for new step interfaces
- [ ] Ensure proper error handling
- [ ] Update type definitions

#### 4.2 Verify lib/ Dependencies

- [ ] Audit all required libraries
- [ ] Verify imports and exports
- [ ] Check for any missing utilities
- [ ] Ensure proper file locations
- [ ] Validate integration points

#### 4.3 Testing get-products Action

- [ ] Manual testing plan:
  - Test with different parameter combinations
  - Verify CSV generation
  - Validate storage functionality
  - Check error scenarios

### 5. Download-File Action Migration 🔜

#### 5.1 Initial Analysis

- [ ] Review current implementation
- [ ] Identify dependencies
- [ ] Plan directory structure

#### 5.2 Implementation

- [ ] Migrate core functionality
- [ ] Apply clean architecture principles
- [ ] Ensure proper error handling
- [ ] Update for integration with get-products

#### 5.3 Testing

- [ ] Verify standalone functionality
- [ ] Test integration with get-products
- [ ] Validate error scenarios

### 6. Final Tasks ⏳

- [ ] Add tests (postponed)
- [ ] Add documentation (postponed)

## Migration Progress Tracking

### Status Key

- 🔄 In Progress
- ✅ Complete
- ❌ Blocked
- ⏳ Waiting
- 🔍 In Review

### Current Status

- ✅ Initial Setup
- ✅ Core Files Migration
- ✅ Step Implementation
- 🔄 Get-Products Action Completion
- ⏳ Download-File Action Migration
- ⏳ Final Tasks

## Notes

- Keep master's error handling patterns
- Maintain performance monitoring
- Preserve all current functionality
- Follow master's directory structure
- Use master's utility functions where available

## Questions/Decisions

- [ ] Should we move any functionality to core utilities?
- [ ] Do we need to update any dependencies?
- [ ] Are there any breaking changes to consider?
- [ ] Should we add any new configuration options?

## Testing Checklist

### Get Products Action

- [ ] Basic functionality with default fields
- [ ] Field selection works (via URL parameters)
- [ ] Inventory enrichment works (via URL parameters)
- [ ] Category enrichment works (via URL parameters)
- [ ] Error handling works
- [ ] Performance metrics included in response
- [ ] CSV file generation works
- [ ] File storage works
- [ ] Download URL works

### Integration Points

- [ ] Frontend can call get-products
- [ ] Download-file action works
- [ ] Storage configuration works
- [ ] Commerce API integration works
