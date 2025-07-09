#!/usr/bin/env node

/**
 * Test Script - Clean Orchestrator Pattern
 * Focuses on WHAT to test, not HOW to parse complex CLI arguments
 */

const { scriptFramework } = require('./core/operations');

/**
 * Clean business logic for test operations
 * @param {Object} context - Script context with domains and args
 * @returns {Promise<Object>} Test result
 */
async function testBusinessLogic(context) {
  const { test, args } = context;

  // Step 1: Execute test orchestration workflow with parsed options
  const testResult = await test.orchestrate.testOrchestrationWorkflow({
    args: args.args,
    rawOutput: args.rawOutput,
    verbose: args.verbose,
  });

  // Step 2: Return result based on success/failure
  if (testResult.success) {
    return scriptFramework.success(
      {
        command: testResult.command,
        target: testResult.target,
        environment: testResult.environment,
        completed: testResult.success,
      },
      testResult.message || 'Test completed successfully'
    );
  } else {
    return scriptFramework.error(testResult.message || 'Test failed');
  }
}

// Create script with framework - clean and simple like build.js and deploy.js!
const testScript = scriptFramework.createScript(testBusinessLogic, {
  scriptName: 'test',
  domains: ['test'],
  description: 'Test Adobe App Builder actions, APIs, and performance',
  cliOptions: {
    rawOutput: {
      flags: ['--raw'],
      description: 'Output raw JSON response only',
    },
    verbose: {
      flags: ['--verbose'],
      description: 'Show detailed output',
    },
  },
  examples: [
    'npm run test action get-products',
    'npm run test action delete-file fileName=products.csv',
    'npm run test api',
    'npm run test performance rest-vs-mesh',
  ],
});

// Export main function for npm scripts
module.exports = testScript;

// Run if called directly
if (require.main === module) {
  testScript.main();
}
