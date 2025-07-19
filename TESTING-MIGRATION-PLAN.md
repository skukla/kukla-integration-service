# Testing Domain Migration Plan

## Overview

**Objective**: Consolidate testing functionality into a primary domain with Feature-First DDD organization

**Current Problem**: Testing is scattered across two locations with inconsistent organization:

- `src/shared/testing/` (layer-first: operations/, workflows/, utils/)
- `scripts/test/` (separate testing utilities)

**Target Solution**: Unified `src/testing/` domain with Feature-First organization

---

## Migration Strategy: Consolidate-Then-Remove Pattern

### Phase 1: Build New Testing Domain (Parallel Development)

**Duration**: 2-3 days  
**Goal**: Create new `src/testing/` domain alongside existing structure

#### 1.1 Create Primary Domain Structure

```bash
mkdir -p src/testing
mkdir -p src/testing/shared
```

#### 1.2 Consolidate Testing Features

Create Feature-First files by consolidating existing functionality:

**From `src/shared/testing/` + `scripts/test/`:**

```text
src/testing/
├── action-testing.js           # Consolidate: scripts/test/action-testing.js + src/shared/testing/workflows/action-testing.js
├── api-testing.js              # Consolidate: scripts/test/api-testing.js + src/shared/testing/workflows/api-testing.js  
├── performance-testing.js      # Consolidate: scripts/test/performance-testing.js + src/shared/testing/workflows/performance-testing.js
├── test-orchestration.js       # From: src/shared/testing/workflows/test-orchestration.js
├── suite-testing.js            # From: scripts/test/suite-testing.js
└── shared/                     # Cross-testing utilities only
    ├── test-config.js          # From: src/shared/testing/utils/config.js
    ├── test-scenarios.js       # From: src/shared/testing/utils/scenarios.js
    ├── test-endpoints.js       # From: src/shared/testing/utils/endpoints.js
    └── test-formatting.js     # From: src/shared/testing/operations/formatting.js (if truly shared)
```

#### 1.3 Apply Feature-First Organization

Each feature file follows the pattern:

```javascript
// === BUSINESS WORKFLOWS === (What scripts/actions use)
async function executeCompleteTestWorkflow(params, config) { }

// === FEATURE OPERATIONS === (Coordination logic)
async function prepareTestEnvironment(params, config) { }
async function executeTestSuite(testSuite, config) { }
async function validateTestResults(results, config) { }

// === FEATURE UTILITIES === (Building blocks)
function buildTestConfiguration(params) { }
function formatTestOutput(results) { }
function validateTestInputs(inputs) { }
```

#### 1.4 Update Configuration

```javascript
// config/domains/testing.js - Keep existing, update imports when ready

// config/index.js - Add testing domain
const testing = require('./domains/testing');

module.exports = {
  // ... existing domains
  testing: testing.buildTestingConfig(params, mainConfig),
};
```

### Phase 2: Validation (Isolated Testing)

**Duration**: 1 day  
**Goal**: Verify new testing domain works in isolation

#### 2.1 Syntax and Import Validation

```bash
# Test each new testing file loads correctly
node -e "require('./src/testing/action-testing.js')"
node -e "require('./src/testing/api-testing.js')"
node -e "require('./src/testing/performance-testing.js')"
node -e "require('./src/testing/test-orchestration.js')"
node -e "require('./src/testing/suite-testing.js')"

# Verify shared utilities work
node -e "require('./src/testing/shared/test-config.js')"
```

#### 2.2 ESLint Compliance

```bash
npm run lint src/testing/
```

#### 2.3 Feature-First Organization Audit

```bash
npm run audit src/testing/ --feature-first-only
```

### Phase 3: Atomic Integration (Switch All Imports)

**Duration**: 1 day  
**Goal**: Update all imports to use new testing domain

#### 3.1 Update Scripts Imports

**Files to update:**

- `scripts/test.js` - Main test script
- Any other scripts that import testing utilities

```javascript
// BEFORE
const { testActionWorkflow } = require('./test/action-testing');
const { testApiWorkflow } = require('./test/api-testing');

// AFTER  
const { executeActionTestWorkflow } = require('../src/testing/action-testing');
const { executeApiTestWorkflow } = require('../src/testing/api-testing');
```

#### 3.2 Update Source Code Imports

**Files to update:**

- Any `src/` files that import from `src/shared/testing/`

```javascript
// BEFORE
const { execution, formatting } = require('../shared/testing/operations');

// AFTER
const { executeTestSuite } = require('../testing/test-orchestration');
const { formatTestResults } = require('../testing/shared/test-formatting');
```

#### 3.3 Update Configuration Imports

Update any configuration that references testing paths.

### Phase 4: System Validation (Complete Testing)

**Duration**: 1 day  
**Goal**: Verify entire system works with new testing domain

#### 4.1 Script Testing

```bash
# Test all testing scripts work
npm run test:action get-products
npm run test:perf
npm run audit:test

# Test script workflows
node scripts/test.js --action=get-products
node scripts/test.js --type=performance --action=get-products
```

#### 4.2 Integration Testing

```bash
# Test that testing domain integrates with other domains
npm run deploy  # Should work without testing errors
npm run audit   # Should pass with new testing domain
```

#### 4.3 Performance Validation

```bash
# Ensure no performance regression
npm run test:perf:compare  # Compare before/after performance
```

### Phase 5: Cleanup (Safe Removal)

**Duration**: 1 day  
**Goal**: Remove old testing structure after validation

#### 5.1 Remove Old Directories

```bash
# Only after confirming new system works completely
rm -rf src/shared/testing/
rm -rf scripts/test/

# Verify old structure is gone
find src/ -path "*/shared/testing" -type d
find scripts/ -path "*/test" -type d
```

#### 5.2 Update Documentation

- Update any references to old testing structure in docs/
- Update README if it references testing scripts

#### 5.3 Final Validation

```bash
# Ensure complete system works after cleanup
npm run test:action get-products
npm run test:perf
npm run audit
npm run deploy
```

---

## Detailed File Consolidation Strategy

### Action Testing Consolidation

**Target**: `src/testing/action-testing.js`

**Sources to consolidate:**

1. `scripts/test/action-testing.js` (47 lines) - Action test workflows
2. `src/shared/testing/workflows/action-testing.js` (if exists) - Action test infrastructure

**Consolidation approach:**

- Take main workflow logic from scripts version
- Integrate any infrastructure utilities from shared version
- Apply Feature-First organization (workflows → operations → utilities)

### API Testing Consolidation  

**Target**: `src/testing/api-testing.js`

**Sources to consolidate:**

1. `scripts/test/api-testing.js` (40 lines) - API test workflows
2. `src/shared/testing/workflows/api-testing.js` (35 lines) - API test infrastructure

**Consolidation approach:**

- Merge workflow logic from both sources
- Eliminate any duplication between the two
- Focus on complete API testing capability

### Performance Testing Consolidation

**Target**: `src/testing/performance-testing.js`

**Sources to consolidate:**

1. `scripts/test/performance-testing.js` (45 lines) - Performance test workflows
2. `src/shared/testing/workflows/performance-testing.js` (36 lines) - Performance test infrastructure
3. Integration with existing performance testing framework

**Consolidation approach:**

- Preserve existing performance framework integration
- Consolidate workflow orchestration logic
- Maintain compatibility with performance scenarios

### Test Orchestration

**Target**: `src/testing/test-orchestration.js`

**Sources:**

1. `src/shared/testing/workflows/test-orchestration.js` (55 lines) - Main orchestration logic

**Approach:**

- Move directly with Feature-First organization applied
- Integrate with consolidated testing features

### Shared Testing Utilities

**Target**: `src/testing/shared/`

**Sources to evaluate:**

1. `src/shared/testing/utils/config.js` (21 lines) - Test configuration
2. `src/shared/testing/utils/scenarios.js` (54 lines) - Test scenarios  
3. `src/shared/testing/utils/endpoints.js` (17 lines) - Test endpoints
4. `src/shared/testing/operations/formatting.js` (223 lines) - Test formatting
5. `src/shared/testing/operations/validation.js` (99 lines) - Test validation
6. `src/shared/testing/operations/error-handling.js` (76 lines) - Test error handling

**Consolidation strategy:**

- **Keep in shared/** if truly used by 3+ testing features
- **Move to feature files** if only used by 1-2 features
- **Apply strategic duplication** for small utilities (<50 lines)

---

## Risk Mitigation

### Backup Strategy

```bash
# Before starting migration, create backup branch
git checkout -b backup/pre-testing-migration
git push origin backup/pre-testing-migration

# Create migration branch
git checkout -b feature/testing-domain-migration
```

### Rollback Plan

If issues arise during migration:

1. **Stop at current phase** - Don't proceed to next phase
2. **Revert to backup branch** - Complete rollback if needed
3. **Fix issues incrementally** - Address specific problems and retry

### Validation Gates

Each phase includes validation commands that must pass:

- **Phase 1**: New files load without errors
- **Phase 2**: ESLint passes, audit compliance
- **Phase 3**: All imports resolve correctly  
- **Phase 4**: All scripts and workflows function correctly
- **Phase 5**: System works after cleanup

### Testing Strategy

- **Parallel development** - Build new alongside old (Phase 1-2)
- **Atomic switching** - Change all imports simultaneously (Phase 3)
- **Comprehensive validation** - Test everything before cleanup (Phase 4)
- **Safe removal** - Only remove old structure after validation (Phase 5)

---

## Success Criteria

### Functional Requirements

- [ ] **All test scripts work** - `npm run test:*` commands function correctly
- [ ] **No functionality loss** - All existing testing capabilities preserved
- [ ] **Performance maintained** - No regression in test execution performance
- [ ] **Integration preserved** - Testing integrates correctly with other domains

### Architectural Requirements  

- [ ] **Feature-First organization** - All testing follows Feature-First DDD patterns
- [ ] **Domain boundaries clear** - Testing is clearly separate from infrastructure
- [ ] **No duplication** - Consolidation eliminates scattered testing utilities
- [ ] **Standards compliance** - Testing domain meets all architectural standards

### Quality Requirements

- [ ] **ESLint compliance** - All testing code passes linting rules
- [ ] **Audit compliance** - Testing domain passes architectural audit
- [ ] **Documentation complete** - Standards reflect new testing domain organization
- [ ] **Import clarity** - All testing imports are direct and obvious

---

## Post-Migration Benefits

### Developer Experience

- ✅ **Single testing location** - All testing capabilities in `src/testing/`
- ✅ **Feature-First discovery** - Easy to find testing functionality
- ✅ **Consistent patterns** - Same organization as other domains
- ✅ **Clear ownership** - Testing team owns complete testing domain

### Architectural Quality

- ✅ **Domain clarity** - Testing is clearly a business domain, not infrastructure
- ✅ **No scattered utilities** - Consolidated testing capabilities
- ✅ **Feature cohesion** - Related testing functions grouped together
- ✅ **Progressive disclosure** - Complex testing workflows broken down clearly

### Maintenance Benefits

- ✅ **Single point of change** - Testing modifications in one domain
- ✅ **Easy testing expansion** - Add new testing features to testing domain
- ✅ **Clear boundaries** - Testing concerns separate from other domains
- ✅ **Unified standards** - Testing follows same patterns as other domains

This migration establishes testing as a first-class domain with the same architectural quality and organization patterns as products, files, commerce, and htmx domains.
