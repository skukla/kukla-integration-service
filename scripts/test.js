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

  // For test:action commands, require action=<name> format
  if (args.actionName) {
    // Action testing - use standardized action=<name> format
    const result = await dispatchTest('action', args.actionName, {
      params: args.params,
      isProd: args.prod,
      rawOutput: args.raw,
      failFast: args.failFast,
    });

    if (result.listed) {
      return;
    }

    if (!result.success) {
      process.exit(1);
    }
    return;
  }

  // Check if this looks like an action test with wrong format
  const firstArg = process.argv[2];
  const knownTestTypes = ['api', 'perf', 'performance', 'suite', 'orchestration'];

  if (firstArg && !knownTestTypes.includes(firstArg)) {
    // This looks like someone tried to use the old positional format
    console.log(format.error('Invalid format. Action tests require action=<name> format.'));
    console.log('');
    console.log('Usage: npm run test:action action=<action> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:action action=get-products');
    console.log('  npm run test:action action=get-products useCase=adobeTarget');
    console.log('');
    console.log(`Did you mean: npm run test:action action=${firstArg}?`);
    process.exit(1);
  }

  // For other test types (api, perf, suite), use process.argv pattern
  const testType = firstArg;
  const target = process.argv[3];

  // Validate required arguments for non-action tests
  if (!testType) {
    console.log(format.error('Action name is required'));
    console.log('Usage: npm run test:action action=<action> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:action action=get-products');
    console.log('  npm run test:action action=get-products useCase=adobeTarget');
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
