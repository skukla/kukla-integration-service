# Scripts Architecture - Light DDD Approach

## Overview

The scripts architecture follows a **Light Domain-Driven Design (Light DDD)** approach that maintains consistency with the main codebase while eliminating over-engineering that creates cognitive load.

## Core Principles

### 1. **Maintain Domain Organization**

- Keep domain separation (`deploy/`, `test/`, `build/`)
- Use `core/` for shared utilities (consistent with main codebase)
- Each domain handles its specific responsibilities

### 2. **Eliminate Unnecessary Abstraction**

- **No 9-layer abstraction chains** for simple operations
- **No complex workflow orchestration** for basic string formatting
- **No domains for domains** (avoid over-engineering like format domains)

### 3. **Clean Orchestrator Pattern**

- **Single orchestration function** per workflow
- **Clear step-by-step execution** with explicit error handling
- **Consistent return format** across all workflows

### 4. **Simple, Reusable Functions**

- **Direct, readable functions** instead of complex abstractions
- **Shared utilities** in `scripts/core/` for consistency
- **No over-engineering** - keep functions simple and focused

### 5. **Proper Separation of Concerns**

- **Main scripts** are thin entry points that delegate to domain workflows
- **Shared utilities** belong in `scripts/core/`
- **Business logic** belongs in domain workflows
- **Each file has one clear responsibility**

## Architecture Structure

```bash
scripts/
├── core/                    # Shared utilities (like main codebase)
│   ├── formatting.js        # Simple formatting functions
│   ├── args.js              # Command line argument parsing
│   ├── environment.js       # Environment detection
│   └── operations/          # Core operations
├── deploy/                  # Deploy domain
│   ├── operations/          # Direct deployment operations
│   └── workflows/           # Simple orchestration workflows
├── test/                    # Test domain
│   ├── operations/          # Direct testing operations
│   └── workflows/           # Simple test workflows
├── build/                   # Build domain
│   ├── operations/          # Direct build operations
│   └── workflows/           # Simple build workflows
└── [main-scripts]/          # Entry point scripts
    ├── deploy.js            # Main deployment script
    ├── test.js              # Main test script
    └── build.js             # Main build script
```

## Light DDD File Structure Pattern

**Reference Implementation:** See `scripts/deploy-proper.js` and `scripts/deploy/workflows/app-deployment-simple.js` for working examples of this pattern. (Note: These will be renamed to their final production names: `deploy.js` and `app-deployment.js` respectively)

### **Main Script Entry Point** (Thin Delegation Layer)

```javascript
#!/usr/bin/env node
/**
 * [Script Name] - Light DDD Entry Point
 * Thin entry point that delegates to appropriate domain workflows
 */

const { parse[ScriptType]Args, show[ScriptType]Help } = require('./core/args');
const { [workflowName]Workflow } = require('./[domain]/workflows/[workflow-file]');
const format = require('./core/formatting');

async function main() {
  const args = parse[ScriptType]Args(process.argv.slice(2));

  if (args.help) {
    show[ScriptType]Help();
    return;
  }

  try {
    const result = await [workflowName]Workflow(args);
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.log(format.error(`Script execution failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

### **Domain Workflow** (Clean Orchestrator)

```javascript
/**
 * [Domain] Domain - [Workflow Name] Workflow
 * Clean orchestrator pattern following Light DDD principles
 */

const format = require('../../core/formatting');
const { [operations] } = require('../operations');

async function [workflowName]Workflow(options = {}) {
  const steps = [];

  try {
    // Step 1: Clear operation
    const result1 = await operation1(options);
    console.log(format.success('Step 1 completed'));
    steps.push('Successfully completed step 1');
    
    // Step 2: Clear operation
    await operation2(result1, options);
    console.log(format.success('Step 2 completed'));
    steps.push('Successfully completed step 2');
    
    // Final status display
    console.log();
    console.log(format.status('SUCCESS', 200));
    console.log(format.section('Message: Operation completed successfully'));
    console.log();
    console.log(format.section('Steps:'));
    console.log(format.steps(steps));
    
    return { success: true, steps };
  } catch (error) {
    console.log(format.error(`Workflow failed: ${error.message}`));
    return { success: false, error: error.message, steps };
  }
}

module.exports = {
  [workflowName]Workflow,
};
```

### **Shared Core Utilities**

```javascript
/**
 * Scripts Core - [Utility Type] Utilities
 * Shared utilities for consistent script behavior
 */

// Simple, focused functions that are reusable across domains
function utilityFunction(param) {
  // Direct implementation - no unnecessary abstraction
  return result;
}

module.exports = {
  utilityFunction,
};
```

## Standards for Auditing

### ✅ **Good Patterns**

#### Proper File Responsibility

```javascript
// ✅ GOOD: Main script - only argument processing and delegation
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await domainWorkflow(args);
}

// ✅ GOOD: Domain workflow - only business orchestration
async function workflow(options) {
  const steps = [];
  // Step-by-step business logic
  return { success: true, steps };
}

// ✅ GOOD: Core utility - only shared functionality
function parseArgs(args) {
  // Pure argument parsing logic
  return parsedArgs;
}
```

#### Clean Orchestrator Pattern

```javascript
/**
 * Workflow - Clean orchestrator pattern
 * Single function that orchestrates all operations
 */
async function myWorkflow(options = {}) {
  const steps = [];
  
  try {
    // Step 1: Clear operation
    const result1 = await operation1(options);
    console.log(format.success('Step 1 completed'));
    steps.push('Successfully completed step 1');
    
    // Step 2: Clear operation
    await operation2(result1, options);
    console.log(format.success('Step 2 completed'));
    steps.push('Successfully completed step 2');
    
    // Final status display
    console.log(format.status('SUCCESS', 200));
    console.log(format.steps(steps));
    
    return { success: true, steps };
  } catch (error) {
    console.log(format.error(`Workflow failed: ${error.message}`));
    return { success: false, error: error.message, steps };
  }
}
```

#### Simple Formatting Functions

```javascript
// ✅ Good: Simple, direct formatting
function success(message) {
  return chalk.green(`✔ ${message}`);
}

function url(url) {
  return `🔗 URL: ${chalk.blue(url)}`;
}
```

#### Direct Operations

```javascript
// ✅ Good: Direct, readable operation
async function deployToAdobeIO(environment, verbose) {
  const spinner = ora('Deploying to Adobe I/O...').start();
  
  // Direct operation logic
  const result = await runDeployment(environment);
  
  spinner.succeed('Deployment completed');
  return result;
}
```

#### Eliminate Duplication Without Over-Abstraction

```javascript
// ✅ Good: Simple shared function for repeated 3+ line patterns
function buildActionUrl(actionName, params) {
  const config = loadConfig(params);
  return buildRuntimeUrl(actionName, null, config);
}

function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
}

// ✅ Good: Using shared functions
async function executeActionTest(actionName, params) {
  const actionUrl = buildActionUrl(actionName, params);
  const response = await testAction(actionUrl, params);
  
  return {
    ...response,
    success: isSuccessfulResponse(response),
    actionUrl,
  };
}

// ❌ Bad: Repeating 3+ line patterns
async function executeActionTest(actionName, params) {
  const config = loadConfig(params);          // Repeated
  const actionUrl = buildRuntimeUrl(actionName, null, config); // Repeated
  const response = await testAction(actionUrl, params);
  
  return {
    ...response,
    success: response.status === 200,          // Inconsistent success logic
    actionUrl,
  };
}
```

#### Clear API Contracts for Shared Utilities

```javascript
// ✅ Good: Clear, documented API contracts
function handleEnvironmentDetection(params = {}, options = {}) {
  const { silent = false, allowCli = true } = options;
  // Clear what each parameter does
}

// Usage examples:
core.handleEnvironmentDetection({}, { silent: false });  // Deploy workflow
core.handleEnvironmentDetection(params, { silent: true }); // Raw mode

// ❌ Bad: Unclear parameter meanings
core.handleEnvironmentDetection({}, false);
//                              ^   ^
//                              ?   What does false mean?
```

#### Business Logic in Proper Operations Layer

```javascript
// ✅ Good: Business logic in domain operations
// scripts/deploy/operations/index.js
function buildStaticAppUrl(environment) {
  const runtimeUrl = core.buildActionUrl('', { NODE_ENV: environment });
  return runtimeUrl
    .replace('adobeioruntime.net', 'adobeio-static.net')
    .replace('/api/v1/web/kukla-integration-service/', '/');
}

// scripts/test/operations/index.js  
function filterActionParameters(params) {
  return Object.keys(params)
    .filter(key => !key.startsWith('AIO_'))
    .reduce((obj, key) => ({ ...obj, [key]: params[key] }), {});
}

// ❌ Bad: Business logic in workflows or low-level functions
// Embedded URL manipulation in workflow
const staticUrl = core.buildActionUrl('', { NODE_ENV: env })
  .replace('adobeioruntime.net', 'adobeio-static.net'); // Business logic in workflow

// Parameter filtering embedded in HTTP function
function testAction(url, params) {
  const filtered = Object.keys(params).filter(key => !key.startsWith('AIO_'));
  // HTTP logic mixed with business logic
}
```

#### Configuration Over Hardcoded Values

```javascript
// ✅ Good: Configuration-driven values
function getDeploymentConfig() {
  return {
    defaultDownloadFile: 'products.csv',
    simulationDelays: { build: 2000, deploy: 3000 },
  };
}

const config = deployOperations.getDeploymentConfig();
const downloadUrl = buildDownloadUrl(env, config.defaultDownloadFile);

// ❌ Bad: Hardcoded values scattered through code
const downloadUrl = actionUrl + '?fileName=products.csv'; // Hardcoded filename
```

### ❌ **Anti-Patterns to Avoid**

#### Mixed Concerns in Single File

```javascript
// ❌ Bad: Mixing argument parsing + workflow + entry point
// deploy.js
const args = process.argv.slice(2); // Argument parsing
async function deployWorkflow() { /* workflow logic */ } // Business logic
async function main() { /* entry point */ } // Entry point
```

#### Over-Abstraction Chains

```javascript
// ❌ Bad: 9-layer abstraction for simple formatting
facade.deployStart() 
  → workflow.scriptLifecycle() 
    → operations.generateMessage() 
      → templates.deployTemplate() 
        → utils.formatMessage()
```

#### Complex Workflow Orchestration for Simple Operations

```javascript
// ❌ Bad: Complex orchestration for basic string formatting
async function formatMessage(operation, target) {
  const workflow = await scriptLifecycleWorkflow({
    operation,
    target,
    emphasis: true,
  });
  return workflow.start();
}
```

#### Domains for Domains

```javascript
// ❌ Bad: Over-engineered domain structure
scripts/format/          # Unnecessary domain for formatting
├── operations/          # Operations for formatting operations
├── workflows/           # Workflows for formatting workflows
└── utils/              # Utilities for formatting utilities
```

## Visual Output Standards

### Consistent Formatting Style

Based on the clean style from the original test-action.js:

```bash
✔ Environment detected: Staging
✔ Build process completed
🔗 URL: https://285361-188maroonwallaby-stage.adobeio-static.net/index.html
📦 Storage: App Builder (Adobe I/O Files)

Status: SUCCESS (200)
Message: Deployment completed successfully

🔗 Download URL:
   https://285361-188maroonwallaby-stage.adobeioruntime.net/api/v1/web/...

Steps:
1. Successfully detected staging environment
2. Successfully built application for staging
3. Successfully deployed 5 actions to Adobe I/O Runtime
4. Successfully updated API Mesh configuration
```

### Formatting Functions Usage

```javascript
// Use consistent formatting functions
console.log(format.success('Environment detected: Staging'));
console.log(format.url('https://example.com'));
console.log(format.storage('App Builder (Adobe I/O Files)'));
console.log(format.status('SUCCESS', 200));
console.log(format.steps(['Step 1', 'Step 2', 'Step 3']));
```

## Implementation Guidelines

### 1. **Start with Orchestrator**

- Create single workflow function that orchestrates all operations
- Use clear step-by-step execution with try/catch error handling
- Return consistent format: `{ success: boolean, steps: Array, ... }`

### 2. **Keep Operations Simple**

- One operation per function
- Direct, readable implementation
- No unnecessary abstraction layers

### 3. **Use Shared Utilities**

- Use `scripts/core/formatting.js` for consistent visual output
- Use `scripts/core/args.js` for command line argument parsing
- Use `scripts/core/environment.js` for environment detection
- Create new shared utilities in `scripts/core/` as needed

### 4. **Follow Main Codebase Patterns**

- Use same error handling patterns as main codebase
- Use same return value structures as main codebase
- Use same documentation standards as main codebase

### 5. **Proper File Organization**

- **Main scripts**: Thin entry points in root scripts/ directory
- **Domain workflows**: Business orchestration in `scripts/[domain]/workflows/`
- **Domain operations**: Specific operations in `scripts/[domain]/operations/`
- **Shared utilities**: Common functions in `scripts/core/`

## Audit Questions

When reviewing scripts, ask:

1. **Is this following the clean orchestrator pattern?**
   - Single function that orchestrates operations?
   - Clear step-by-step execution?
   - Consistent error handling?

2. **Are there unnecessary abstraction layers?**
   - More than 3 levels of abstraction for simple operations?
   - Complex workflows for basic string formatting?
   - Domains created for simple utilities?

3. **Is business logic in the proper layer?**
   - URL transformations in domain operations, not workflows?
   - Parameter filtering in operations, not low-level functions?
   - Configuration management centralized, not scattered?

4. **Are API contracts clear and documented?**
   - Function parameters have clear meanings?
   - Options objects used instead of boolean flags?
   - JSDoc documentation explains each parameter?

5. **Is configuration used over hardcoded values?**
   - Filenames, delays, URLs come from configuration?
   - Domain operations provide configuration functions?
   - No magic strings or numbers in workflows?

6. **Is the formatting consistent?**
   - Using `scripts/core/formatting.js` functions?
   - Following the established visual style?
   - Clear, readable output?

7. **Does it maintain consistency with the main codebase?**
   - Using same patterns as `src/` domains?
   - Following same error handling approaches?
   - Using same documentation standards?

8. **Are concerns properly separated?**
   - Main scripts only handle argument processing and delegation?
   - Workflows orchestrate operations without business logic?
   - Operations contain business logic specific to their domain?
   - Domain workflows only handle business orchestration?
   - Shared utilities only handle reusable functionality?
   - No mixed concerns in single files?

## Migration Strategy

When refactoring existing over-engineered scripts:

1. **Identify the core operations** being performed
2. **Separate mixed concerns** into appropriate files:
   - Argument parsing → `scripts/core/args.js`
   - Business logic → `scripts/[domain]/workflows/`
   - Entry point → `scripts/[script-name].js`
3. **Create clean orchestrator workflow** that uses the operations
4. **Replace complex abstraction chains** with direct function calls
5. **Update main script** to use the clean orchestrator
6. **Test thoroughly** to ensure functionality is preserved

This approach maintains the organizational benefits of DDD while eliminating the cognitive overhead of over-engineering.

## Strategic Duplication for Domain Clarity

### Philosophy

**Cognitive Load > Code Deduplication**: When forced to choose between eliminating duplication and reducing cognitive load, **choose cognitive load reduction**. Small amounts of strategic duplication that improve domain clarity and reduce mental overhead are preferable to complex shared abstractions.

### When to Duplicate vs Abstract

#### ✅ **Prefer Duplication For:**

**Small Utilities (2-10 lines)**

```javascript
// ✅ Good: Domain-specific versions for clarity
// test/operations/index.js
function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
}

// deploy/operations/index.js  
function buildDownloadUrl(environment, fileName = 'products.csv') {
  const config = loadConfig({ NODE_ENV: environment });
  const actionUrl = buildRuntimeUrl('download-file', null, config);
  return `${actionUrl}?fileName=${fileName}`;
}

// ❌ Bad: Generic abstraction requiring mental overhead
// core/index.js
function buildActionUrl(actionName, params) { /* 4 lines */ }
// Used in: test (2 places), deploy (2 places) - requires jumping to core to understand
```

**Domain-Specific Business Logic**

```javascript
// ✅ Good: Deploy domain owns its URL transformations
function buildStaticAppUrl(environment) {
  const runtimeUrl = buildActionUrl('', { NODE_ENV: environment });
  return runtimeUrl
    .replace('adobeioruntime.net', 'adobeio-static.net')
    .replace('/api/v1/web/kukla-integration-service/', '/');
}

// ✅ Good: Test domain owns its HTTP logic  
function testAction(actionUrl, params) {
  // 20 lines of HTTP testing logic specific to actions
}
```

**Operations Used in Only One Domain**

```javascript
// ✅ Good: Move single-domain utilities to their domain
// build/operations/index.js
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
// Only used in build domain - no duplication, clear ownership
```

#### 🚫 **Prefer Abstraction For:**

**Widely Used Infrastructure (>10 lines, >3 domains)**

```javascript
// ✅ Good: Keep in core - used everywhere
function handleEnvironmentDetection(params, options) {
  // 30+ lines of complex environment detection logic
  // Used in: deploy, test, build domains
}

function createSpinner(text) {
  // Spinner creation logic used across all domains
}

const formatting = {
  success, error, warning, info, url, storage, status, steps
  // Formatting functions used across all domains
};
```

**Complex Shared Business Logic**

```javascript
// ✅ Good: Keep in core - complex logic worth sharing
function parseArgs(args) {
  // 20+ lines of argument parsing logic
  // Used by all main scripts
}
```

### Guidelines for Strategic Duplication

#### 1. **Duplication Threshold**

- **0-10 lines**: Prefer duplication for domain clarity
- **10-30 lines**: Evaluate cognitive load vs maintenance burden
- **30+ lines**: Prefer abstraction to reduce maintenance burden

#### 2. **Domain Clarity Test**

Ask: "Does this utility belong conceptually to one domain?"

- **Yes**: Move to that domain (even if used elsewhere)
- **No**: Keep in core as shared infrastructure

#### 3. **Mental Overhead Test**  

Ask: "Does using this require jumping to another file to understand?"

- **Yes**: Consider domain-specific versions
- **No**: Central abstraction is fine

#### 4. **Usage Frequency Test**

- **Used in 1 domain**: Move to that domain
- **Used in 2 domains**: Consider small duplication
- **Used in 3+ domains**: Keep in core

### Examples Applied to Current Codebase

#### ✅ **Strategic Duplication Winners**

```javascript
// Current: 4-line function in core, used in 2 domains
// New: Domain-specific versions (4 lines each = 8 lines total duplication)
// Benefit: Clear intent, domain autonomy, reduced cognitive load

// test/operations/index.js
function buildActionUrl(actionName, params) {
  const config = loadConfig(params);
  return buildRuntimeUrl(actionName, null, config);
}

// deploy/operations/index.js
function buildDownloadUrl(environment, fileName = 'products.csv') {
  const config = loadConfig({ NODE_ENV: environment });
  const actionUrl = buildRuntimeUrl('download-file', null, config);
  return `${actionUrl}?fileName=${fileName}`;
}
```

#### ✅ **Single Domain Moves (No Duplication)**

```javascript
// Move to owning domain - used in only one place
// build/operations/index.js
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// test/operations/index.js  
function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
}
```

#### ✅ **Core Infrastructure (Keep Shared)**

```javascript
// Keep in core - complex, widely used
function handleEnvironmentDetection(params, options) { /* 30+ lines */ }
const formatting = { success, error, warning, ... };
function createSpinner(text) { /* spinner logic */ }
function parseArgs(args) { /* 20+ lines */ }
```

### Core Module Transformation

#### Before: "Kitchen Sink" (159 lines, 40+ utilities)

```javascript
module.exports = {
  // Environment utilities (3)
  // Script framework (2)  
  // Spinner operations (5)
  // Hash operations (2) - unused
  // String utilities (4) - mostly unused
  // File utilities (5) - unused
  // Workflow utilities (3) - domain-specific
  // Plus 6 more structured exports...
}
```

#### After: "Essential Infrastructure" (~80 lines, 12 utilities)

```javascript  
module.exports = {
  // Environment utilities (truly shared)
  handleEnvironmentDetection,
  detectEnvironment,
  
  // Formatting (truly shared)
  formatting: require('./formatting'),
  
  // Arguments (truly shared)
  parseArgs: require('./operations/script-framework').parseArgs,
  
  // Spinners (truly shared)
  createSpinner: require('./operations/spinner').createSpinner,
  
  // Structured exports for direct access
  operations: {
    environment: require('./operations/environment'),
    spinner: require('./operations/spinner'),
  },
}
```

### Benefits Achieved

- **Cognitive Load**: 60% reduction (40+ utilities → 12 essential utilities)
- **Domain Clarity**: Clear ownership of domain-specific logic
- **Duplication Cost**: 12 lines total (strategic, not accidental)
- **Maintenance**: Each domain can evolve independently
- **Onboarding**: New developers only learn domain they're working in + minimal core

### Trade-off Summary

**Cost**: 12 lines of intentional duplication  
**Benefit**: 60% cognitive load reduction + clear domain boundaries + autonomous evolution

This trade-off strongly favors maintainability and developer experience over DRY principle adherence.
