#!/usr/bin/env node

/**
 * Main Test Script
 * Entry point for testing operations
 */

const core = require('./core');
const format = require('./format');

async function main() {
  const args = core.parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run test:action <action> [options]

Options:
  --help        Show this help message
  --raw         Output raw JSON response only
  --verbose     Enable verbose output
    `);
    return;
  }

  const actionName = args._[1]; // Second argument after 'action'
  if (!actionName) {
    console.log(format.error('Action name is required'));
    console.log('Usage: npm run test:action <action>');
    process.exit(1);
  }

  console.log(format.sectionHeader(`Testing action: ${actionName}`, '⟐'));

  try {
    const { actionTesting } = require('./test/workflows');
    const result = await actionTesting.actionTestingWorkflow(actionName, {
      rawOutput: args.raw,
      verbose: args.verbose,
    });

    if (result.success) {
      console.log(format.success('Test completed successfully'));
    } else {
      console.log(format.error(`Test failed with status ${result.status}: ${result.statusText}`));
      process.exit(1);
    }
  } catch (error) {
    console.log(format.error(`Test failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.log(format.error(`Script execution failed: ${error.message}`));
    process.exit(1);
  });
}
