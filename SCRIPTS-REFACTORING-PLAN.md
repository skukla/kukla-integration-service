# Scripts Refactoring Plan - Light DDD Implementation

## Current Status

✅ **Completed Foundation Work:**

- Identified over-engineering issues (9-layer abstraction chains)
- Established Light DDD principles for scripts
- Created comprehensive documentation in `docs/development/scripts-architecture.md`
- Built working examples of proper Light DDD structure
- Created shared utilities (`scripts/core/formatting.js`, `scripts/core/args.js`)
- Documented audit standards for good vs bad patterns

## The Problem We're Solving

### **Before (Over-engineered):**

```bash
scripts/deploy-simple.js
├── Parameter parsing logic      # Mixed concerns
├── Workflow orchestration      # Mixed concerns
└── Main entry point           # Mixed concerns
```

**Issues:**

- 9-layer abstraction chains for simple console output
- Mixed concerns in single files
- Over-engineered format domain
- High cognitive load
- Lost visual appeal from original scripts

### **After (Light DDD):**

```bash
scripts/
├── core/args.js                    # Shared argument parsing
├── deploy/workflows/app-deployment-simple.js  # Clean orchestrator
└── deploy-proper.js                # Thin entry point
```

**Benefits:**

- ✅ Clear separation of concerns
- ✅ Maintains domain organization
- ✅ Eliminates over-abstraction
- ✅ Beautiful, consistent formatting
- ✅ Easy to understand and maintain

## Refactoring Plan

### **Phase 1: Foundation** ✅ COMPLETE

- [x] Document Light DDD principles
- [x] Create shared utilities (`core/formatting.js`, `core/args.js`)
- [x] Build working examples
- [x] Clean up incorrect examples

### **Phase 2: Main Scripts** (NEXT)

- [ ] Refactor `scripts/deploy.js` to Light DDD pattern
- [ ] Refactor `scripts/test.js` to Light DDD pattern  
- [ ] Refactor `scripts/build.js` to Light DDD pattern
- [ ] Create thin entry points that delegate to domain workflows

### **Phase 3: Domain Workflows**

- [ ] Create clean orchestrator workflows in each domain
- [ ] Move business logic from main scripts to domain workflows
- [ ] Implement consistent error handling and return formats

### **Phase 4: Remove Over-Engineering**

- [ ] Remove complex format domain abstraction chains
- [ ] Eliminate unnecessary workflow orchestration
- [ ] Replace complex operations with direct functions

### **Phase 4.5: Final Production Names**

- [ ] Rename all files to their final production names:
  - `app-deployment-simple.js` → `app-deployment.js`
  - Remove any temporary or example suffixes from filenames
  - Use final, production-ready names throughout
- [ ] Remove all references to "refactoring" in comments and documentation
- [ ] Treat Light DDD as the established development approach (not a refactoring effort)

### **Phase 5: Cleanup Obsolete Files**

**Files/Folders to Delete:**

- [ ] Delete entire `scripts/format/` directory (9-layer abstraction chains):
  - `scripts/format/facade.js`
  - `scripts/format/index.js`
  - `scripts/format/workflows/`
  - `scripts/format/operations/display-formatters.js`
  - `scripts/format/operations/templates.js`
  - `scripts/format/operations/messages.js`
  - `scripts/format/operations/lifecycle-operations.js`
  - `scripts/format/utils/`
- [ ] Remove complex workflow files replaced by clean orchestrators
- [ ] Delete unnecessary utility files consolidated into `scripts/core/`
- [ ] Remove any temporary or example files that shouldn't remain
- [ ] Clean up any leftover files from the over-engineered structure

### **Phase 6: Testing & Validation**

- [ ] Test all refactored scripts functionality
- [ ] Verify visual output matches original clean style
- [ ] Audit against Light DDD standards
- [ ] Fix any broken functionality (like mesh-400 error)

## Key Success Metrics

### **Functionality**

- [ ] `npm run test:action get-products` works with beautiful output
- [ ] `npm run test:action get-products-mesh` works (fix 400 error)
- [ ] `npm run deploy` works with clean visual output
- [ ] `npm run test:api` and `npm run test:perf` work properly

### **Code Quality**

- [ ] No more 9-layer abstraction chains
- [ ] Clear separation of concerns in all files
- [ ] Consistent formatting across all scripts
- [ ] Easy to understand and modify

### **Visual Appeal**

- [ ] Restore the clean formatting style you loved
- [ ] Consistent emoji and symbol usage
- [ ] Beautiful step-by-step output
- [ ] Clear status and URL display

## Implementation Guidelines

### **1. Follow the Patterns**

Use the established patterns in:

- `scripts/deploy-proper.js` (main script entry point) → will become `scripts/deploy.js`
- `scripts/deploy/workflows/app-deployment-simple.js` (domain workflow) → will become `scripts/deploy/workflows/app-deployment.js`
- `scripts/core/args.js` (shared utilities)
- `scripts/core/formatting.js` (formatting functions)

### **2. Audit Against Standards**

Use the audit questions in `docs/development/scripts-architecture.md`:

- Is this following the clean orchestrator pattern?
- Are there unnecessary abstraction layers?
- Is the formatting consistent?
- Are concerns properly separated?

### **3. Preserve What Works**

- Keep the beautiful visual output from original test-action.js
- Maintain all existing functionality
- Preserve domain organization benefits
- Keep consistency with main codebase patterns

### **4. Cleanup Criteria**

**Files to Delete (Over-engineered):**

- Any file that creates 9-layer abstraction chains
- Complex format domain files (`scripts/format/`)
- Workflow orchestration for simple operations
- Utility files with single-use functions
- Any file that mixes multiple concerns

**Files to Keep (Clean & Necessary):**

- Main script entry points (thin delegation)
- Clean orchestrator workflows
- Shared utilities in `scripts/core/`
- Direct operation functions
- Files with single, clear responsibilities

## Next Steps

1. **Start with `scripts/deploy.js`** - refactor to Light DDD pattern
2. **Test thoroughly** - ensure functionality is preserved
3. **Continue with `scripts/test.js`** - fix broken workflows
4. **Work systematically** through each script
5. **Audit continuously** against established standards

## Success Criteria

When this refactoring is complete, we should have:

- ✅ **Beautiful, functional scripts** with the visual appeal you loved
- ✅ **Clean, maintainable code** following Light DDD principles
- ✅ **Consistent patterns** across all scripts
- ✅ **Easy to understand** and modify for future developers
- ✅ **All functionality working** including previously broken features

The goal is to maintain the organizational benefits of DDD while eliminating the cognitive overhead of over-engineering.
