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

  let testType, target;

  // Handle standardized --type flag format
  if (args.testType) {
    testType = args.testType;
    target = args.actionName || args.params.scenario || args.params.name;
  }
  // Handle action testing with --action flag
  else if (args.actionName) {
    testType = 'action';
    target = args.actionName;
  }
  // Fallback to legacy positional arguments for compatibility
  else {
    testType = process.argv[2];
    target = process.argv[3];
  }

  // Check if this looks like an action test with wrong format
  if (!testType && !args.actionName && process.argv[2] && !process.argv[2].startsWith('--')) {
    console.log(format.error('✖ Invalid format. Action tests require --action=<name> format.'));
    console.log('\nUsage: npm run test:action --action=<action> [options]');
    console.log('\nExamples:');
    console.log('  npm run test:action -- --action=get-products');
    console.log('  npm run test:action -- --action=get-products --use-case=adobeTarget');
    console.log('\nDid you mean: npm run test:action -- --action=' + process.argv[2] + '?');
    return;
  }

  // Validate required arguments
  if (!testType && !target) {
    console.log(format.error('Test type or action name is required'));
    showTestHelp();
    return;
  }

  // Dispatch to appropriate test workflow
  const result = await dispatchTest(testType, target, {
    params: args.params,
    isProd: args.prod,
    rawOutput: args.raw,
    failFast: args.failFast,
    list: args.list,
  });

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
