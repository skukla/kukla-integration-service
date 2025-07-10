#!/usr/bin/env node

/**
 * Test Script - Light DDD Entry Point
 * Main entry point that delegates to appropriate test workflows
 */

const { parseTestArgs, showTestHelp } = require('./core/args');
const format = require('./core/formatting');
const { actionTestingWorkflow } = require('./test/workflows/action-testing');

/**
 * Main function - Clean entry point
 * Only handles argument processing and workflow delegation
 */
async function main() {
  const args = parseTestArgs(process.argv.slice(2));

  if (args.help) {
    showTestHelp();
    return;
  }

  const actionName = args.actionName;
  if (!actionName) {
    console.log(format.error('Action name is required'));
    console.log('Usage: npm run test:action <action>');
    process.exit(1);
  }

  try {
    const result = await actionTestingWorkflow(actionName, {
      params: args.params,
      rawOutput: args.raw,
    });

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
