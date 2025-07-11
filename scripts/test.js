#!/usr/bin/env node

/**
 * Test Script - Light DDD Entry Point
 * Main entry point that delegates to appropriate test workflows
 */

const { parseTestArgs, showTestHelp } = require('./core/args');
const format = require('./core/formatting');
const { executeScriptWithExit } = require('./core/operations/script-framework');
const { dispatchTest } = require('./test/operations/test-dispatch');

/**
 * Main function - Clean entry point
 * Handles different test types and delegates to appropriate workflows
 */
async function main() {
  const args = parseTestArgs(process.argv.slice(2));

  if (args.help) {
    showTestHelp();
    return;
  }

  const testType = process.argv[2]; // First argument determines test type
  const target = process.argv[3]; // Second argument is the target (action/endpoint/suite)

  // Validate required arguments
  if (!testType) {
    console.log(format.error('Test type or action name is required'));
    console.log('Usage: npm run test:action <action> [options]');
    process.exit(1);
  }

  const result = await dispatchTest(testType, target, {
    params: args.params,
    isProd: args.prod,
    rawOutput: args.raw,
    failFast: args.failFast,
  });

  // Handle list operations that don't need success check
  if (result.listed) {
    return;
  }

  if (!result.success) {
    process.exit(1);
  }
}

if (require.main === module) {
  executeScriptWithExit('test', main);
}
