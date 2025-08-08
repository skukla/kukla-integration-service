# Frontend Refactoring Plan

## Overview

Refactor Adobe App Builder frontend from over-engineered 16-file structure to focused 7-file architecture while maintaining all functionality.

## Current State

- **16 JavaScript files** (2,658 total lines)
- **Complex main.js** (453 lines with duplicated code)
- **Over-engineered** for Adobe App Builder scale
- **Code duplication** in notification and modal systems

## Target Architecture (7 Files + 1 Entry Point)

```javascript
├── app.js              (~150) - App initialization
├── htmx.js             (~400) - All HTMX handling  
├── config.js           (~100) - Configuration only
├── modals.js           (~250) - Modal system
├── notifications.js    (~260) - Notification system
├── file-browser.js     (~200) - File operations  
├── utils.js            (~200) - URL + general utilities
└── main.js             (~150) - Entry point coordination
```javascript

## Phase 1: Cleanup & Deduplication (Immediate Wins)
**Target: Fix main.js without moving files yet**

### Tasks:
3. ✅ Remove duplicate notification systems from main.js
4. ✅ Remove duplicate modal functions from main.js  
5. ✅ Fix window globals and imports in main.js

**Expected Result:** `main.js: 453 → ~320 lines`

### Key Issues to Fix:
- **Duplicate notifications**: main.js has full notification system when UI components already exist
- **Duplicate modals**: main.js has basic modal functions when UI components has full system
- **Window globals**: `window.showNotification` and `window.hideModal` need cleanup
- **Import conflicts**: main.js imports UI components but doesn't use them

## Phase 2: Strategic Extraction (Architecture Improvement)
**Target: Extract to final 7-file structure**

### Tasks:
6. **Extract main.js business logic → app.js**
   - Move initialization code to `app.js` (~150 lines)
   - Keep only essential coordination in `main.js` (~150 lines)

7. **Consolidate HTMX event handling → htmx.js**
   - Combine `htmx/events.js` (368 lines) + `htmx/setup.js` (196 lines) 
   - Result: `htmx.js` (~400 lines, focused on single concern)

8. **Move URL utilities → utils.js**
   - Combine `core/url/index.js` + general utilities
   - Result: `utils.js` (~200 lines)

### File Mapping:
- `htmx/events.js` + `htmx/setup.js` → `htmx.js`
- `core/url/index.js` + utilities → `utils.js`
- `ui/components/modal/index.js` → `modals.js`
- `ui/components/notifications/index.js` → `notifications.js`
- `ui/file-browser/index.js` + `components/export-products-ui.js` → `file-browser.js`
- `core/config/index.js` → `config.js`
- Main app logic → `app.js`

## Phase 3: Optimization (Simplification)
**Target: Reduce complexity within each file**

### Tasks:
9. **Convert imperative HTMX → declarative HTML attributes**
   - Reduce JavaScript HTMX setup
   - Move logic to HTML `hx-*` attributes

10. **Simplify event handling → hx-on attributes**
    - Replace complex JavaScript event handlers
    - Use HTMX's built-in event handling

## Key Decisions Made

### Modal System Canonicity
- **UI components modal** (254 lines) = CANONICAL
  - Full accessibility, focus management, keyboard handling
  - Used by other modules
  - Configuration-driven
- **Main.js modal** (~20 lines) = DUPLICATE/LEGACY
  - Basic show/hide functionality
  - Should be removed

### File Organization Principles
- **Single responsibility** per file
- **150-400 lines** per file (not mega-files)
- **Clear boundaries** between concerns
- **Related functionality** grouped together

### What NOT to do
- ❌ Don't create mega-files (600+ lines)
- ❌ Don't artificially consolidate unrelated concerns
- ❌ Don't combine config with utilities
- ❌ Don't lose modularity for file count reduction

## Benefits Expected
- **60-75% complexity reduction**
- **Clear module boundaries**
- **Easier maintenance**
- **Better Adobe App Builder alignment**
- **Retained functionality**

## Current Progress
- ✅ Phase 1 Task 1: mesh-client.js formatting cleanup
- ✅ Phase 1 Task 2: main.js duplicate code review
- 🔄 Phase 1 Task 3: Remove duplicate notification systems (IN PROGRESS)

## Next Steps
1. Complete Phase 1 (cleanup duplicates)
2. Test that functionality remains intact
3. Begin Phase 2 (strategic extraction)
4. Validate each phase before proceeding

---
*Plan created during frontend refactoring session to prevent work loss*
