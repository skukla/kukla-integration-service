#!/usr/bin/env node

/**
 * Deploy Script - Proper Light DDD Structure
 * Main entry point that delegates to appropriate domain workflows
 * Demonstrates clean separation of concerns
 */

const { parseDeployArgs, showDeployHelp } = require('./core/args');
const format = require('./core/formatting');
const { appDeploymentWorkflow } = require('./deploy/workflows/app-deployment-simple');

/**
 * Main function - Clean entry point
 * Only handles argument processing and workflow delegation
 */
async function main() {
  const args = parseDeployArgs(process.argv.slice(2));

  if (args.help) {
    showDeployHelp();
    return;
  }

  try {
    const result = await appDeploymentWorkflow({
      meshOnly: args.meshOnly,
      verbose: args.verbose,
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
