# Scripts Architecture & Usage Guide

## Overview

The scripts system uses a **clean orchestrator pattern** that separates business logic from infrastructure concerns. All scripts follow the same architectural pattern used in our actions, providing consistency and maintainability across the project.

## Architecture

### Script Framework (`scripts/core/operations/script-framework.js`)

The core framework provides infrastructure for all scripts through the `createScript()` function:

```javascript
const script = scriptFramework.createScript(businessLogic, {
  scriptName: 'script-name',
  domains: ['domain1', 'domain2'],
  description: 'Script description',
  cliOptions: {
    optionName: {
      flags: ['--flag', '-f'],
      description: 'Option description'
    }
  },
  examples: ['npm run script example']
});
```

**Framework Features:**

- ✅ Automatic CLI parsing and validation
- ✅ Professional help generation
- ✅ Domain context injection
- ✅ Standardized error handling and exit codes
- ✅ Consistent response formatting

### Domain-Driven Structure

```bash
scripts/
├── core/                    # Shared infrastructure
│   ├── operations/          # Framework and shared operations
│   └── utils/               # Shared utilities
├── build/                   # Build domain
│   ├── workflows/           # Build orchestration
│   └── operations/          # Build-specific operations
├── deploy/                  # Deploy domain
│   ├── workflows/           # Deployment orchestration
│   └── operations/          # Deploy-specific operations
└── test/                    # Test domain
    ├── workflows/           # Test orchestration
    └── operations/          # Test-specific operations
```

## Script Usage

### Build Script (`npm run build`)

Builds the Adobe App Builder application for deployment.

**Basic Usage:**

```bash
npm run build                    # Standard build
npm run build -- --help         # Show help
```

**Options:**

```bash
npm run build -- --aio           # Include Adobe I/O App build step
npm run build -- --skip-mesh     # Skip mesh resolver generation
```

**What it does:**

1. Detects environment (staging/production)
2. Generates frontend configuration
3. Generates mesh resolver (unless skipped)
4. Optionally runs Adobe I/O App build

### Deploy Script (`npm run deploy`)

Deploys the application to Adobe I/O Runtime.

**Basic Usage:**

```bash
npm run deploy                   # Deploy to staging
npm run deploy -- --help        # Show help
```

**Options:**

```bash
npm run deploy -- --workspace=Production  # Deploy to production
npm run deploy -- --prod                  # Deploy to production (alias)
npm run deploy -- --skip-build            # Skip build process
npm run deploy -- --skip-mesh             # Skip mesh updates
npm run deploy -- --mesh-only             # Only update mesh (no app deployment)
```

**What it does:**

1. Builds application (unless skipped)
2. Deploys to Adobe I/O Runtime
3. Updates API Mesh configuration
4. Shows deployment URLs

### Test Script (`npm run test`)

Tests Adobe App Builder actions, APIs, and performance.

**Basic Usage:**

```bash
npm run test action <action-name>          # Test specific action
npm run test -- --help                    # Show help
```

**Action Testing:**

```bash
npm run test action get-products           # Test get-products action
npm run test action delete-file fileName=products.csv  # Test with parameters
npm run test action browse-files           # Test browse-files action
```

**Options:**

```bash
npm run test -- --raw                     # Output raw JSON response
npm run test -- --verbose                 # Show detailed output
```

**Available Commands:**

- `action <name>` - Test a specific action
- `api` - Test Commerce API endpoints (not yet implemented)
- `performance [scenario]` - Run performance tests (not yet implemented)

## Script Implementation Pattern

### Business Logic Function

Each script contains pure business logic that focuses on **what** to do, not **how** to parse CLI arguments:

```javascript
async function scriptBusinessLogic(context) {
  const { domain, args } = context;
  
  // Step 1: Execute domain workflow
  const result = await domain.workflow.execute({
    option1: args.option1,
    option2: args.option2
  });
  
  // Step 2: Return formatted result
  return scriptFramework.success(
    { environment: result.environment },
    `Operation completed for ${result.environment}`
  );
}
```

### Script Configuration

The framework handles all infrastructure through configuration:

```javascript
const script = scriptFramework.createScript(scriptBusinessLogic, {
  scriptName: 'my-script',
  domains: ['domain'],
  description: 'What this script does',
  cliOptions: {
    option1: {
      flags: ['--option1', '-o1'],
      description: 'First option description'
    },
    option2: {
      flags: ['--option2'],
      description: 'Second option description'
    }
  },
  examples: [
    'npm run my-script',
    'npm run my-script -- --option1',
    'npm run my-script -- --option1 --option2'
  ]
});
```

### Script Export

Standard export pattern for all scripts:

```javascript
module.exports = script;

// Run if called directly
if (require.main === module) {
  script.main();
}
```

## Creating New Scripts

### 1. Define Business Logic

Focus only on the core functionality:

```javascript
async function newFeatureBusinessLogic(context) {
  const { someService, args } = context;
  
  const result = await someService.workflows.executeFeature({
    featureFlag: args.featureFlag,
    environment: args.environment
  });
  
  if (result.success) {
    return scriptFramework.success(
      { featuresEnabled: result.features },
      `Feature operation completed`
    );
  } else {
    return scriptFramework.error(result.message);
  }
}
```

### 2. Configure Framework

```javascript
const newFeatureScript = scriptFramework.createScript(newFeatureBusinessLogic, {
  scriptName: 'new-feature',
  domains: ['someService'],
  description: 'Manages new feature functionality',
  cliOptions: {
    featureFlag: {
      flags: ['--feature', '-f'],
      description: 'Enable specific feature'
    },
    environment: {
      flags: ['--env', '-e'],
      description: 'Target environment'
    }
  },
  examples: [
    'npm run new-feature',
    'npm run new-feature -- --feature',
    'npm run new-feature -- --env production'
  ]
});
```

### 3. Add to package.json

```json
{
  "scripts": {
    "new-feature": "node scripts/new-feature.js"
  }
}
```

## Framework Benefits

### Automatic CLI Parsing

The framework automatically parses CLI arguments based on configuration:

```javascript
// User runs: npm run script -- --flag1 --flag2 value
// Framework provides: { flag1: true, flag2: 'value', args: ['remaining', 'args'] }
```

### Professional Help Generation

Every script automatically gets professional help:

```bash
$ npm run build -- --help
Usage: npm run build [options]

Build Adobe App Builder application for deployment

Options:
  --aio, --with-aio         Include Adobe I/O App build step
  --skip-mesh               Skip mesh resolver generation
  --help, -h               Show this help message

Examples:
  npm run build                    # Standard build
  npm run build -- --aio           # Build with Adobe I/O App
  npm run build -- --skip-mesh     # Build without mesh generation
```

### Domain Context Injection

Scripts automatically receive domain contexts based on their requirements:

```javascript
// Script configuration
domains: ['build', 'deploy', 'test']

// Automatically injected context
context = {
  build: buildDomain.workflows,
  deploy: deployDomain.workflows,
  test: testDomain,
  args: parsedCliArguments
}
```

### Consistent Error Handling

Framework provides standardized error handling:

```javascript
// In business logic
return scriptFramework.error('Specific error message');

// User sees
❌ Specific error message
// Script exits with code 1
```

### Response Formatting

Standard success/error responses:

```javascript
// Success
return scriptFramework.success(
  { data: 'result data' },
  'Success message'
);
// Output: ✅ Success message, 📍 Environment: production

// Error  
return scriptFramework.error('Error message');
// Output: ❌ Error message
```

## Domain Workflows

### Build Domain (`scripts/build/`)

**Main Workflow:** `appBuild.appBuildWorkflow(options)`

- Frontend configuration generation
- Mesh resolver generation
- Optional Adobe I/O App build

**Sub-workflows:**

- `frontendGeneration.generateFrontendConfig()`
- `meshGeneration.generateMeshResolver()`

### Deploy Domain (`scripts/deploy/`)

**Main Workflow:** `appDeployment.appDeploymentWorkflow(options)`

- Environment detection
- Build process (optional)
- Application deployment
- Mesh updates

**Sub-workflows:**

- `meshDeployment.meshDeploymentWorkflow()`

### Test Domain (`scripts/test/`)

**Main Workflow:** `testOrchestration.testOrchestrationWorkflow(options)`

- Command routing (action/api/performance)
- Argument parsing and validation
- Test execution and result formatting

**Sub-workflows:**

- `actionTesting.actionTestingWorkflow()`
- `apiTesting.*` (planned)
- `performanceTesting.*` (planned)

## Best Practices

### Script Development

1. **Focus on business logic** - Let the framework handle infrastructure
2. **Use domain workflows** - Don't duplicate domain functionality
3. **Return structured responses** - Use `scriptFramework.success()` and `scriptFramework.error()`
4. **Add examples** - Help users understand usage patterns

### Error Handling

1. **Specific error messages** - Help users understand what went wrong
2. **Actionable guidance** - Include suggestions when possible
3. **Consistent formatting** - Use framework response functions

### Configuration

1. **Descriptive options** - Clear flags and descriptions
2. **Useful examples** - Show common usage patterns
3. **Logical grouping** - Related options should be near each other

## Troubleshooting

### Common Issues

**Script not found:**

```bash
npm ERR! missing script: script-name
```

- Check `package.json` scripts section
- Verify script file exists

**Permission errors:**

```bash
permission denied: ./scripts/script.js
```

- Ensure script has shebang: `#!/usr/bin/env node`
- Check file permissions: `chmod +x scripts/script.js`

**Domain not available:**

```bash
❌ Cannot read properties of undefined (reading 'workflow')
```

- Check domain is listed in script configuration
- Verify domain exports the expected workflows

### Debug Mode

Enable debug output for troubleshooting:

```bash
DEBUG=1 npm run script-name
```

This shows additional error details and stack traces.

## Future Enhancements

### Planned Features

1. **Script Testing Framework** - Unit tests for business logic functions
2. **Enhanced Validation** - Schema validation for script options  
3. **Performance Monitoring** - Execution timing and resource usage
4. **Configuration Templates** - Scaffolding for new scripts

### Extension Points

1. **Custom Domain Context** - Add new domain workflows
2. **Advanced CLI Options** - Custom parsing for complex arguments
3. **Output Formatters** - Custom response formatting
4. **Middleware Support** - Pre/post execution hooks
