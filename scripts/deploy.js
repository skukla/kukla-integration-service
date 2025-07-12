#!/usr/bin/env node

/**
 * Deploy Script - Light DDD Entry Point
 * Main entry point that delegates to appropriate domain workflows
 */

const { parseDeployArgs, showDeployHelp } = require('./core/args');
const { executeScriptWithExit } = require('./core/operations/script-framework');
const { parseEnvironmentFromArgs } = require('./core/utils/environment');
const { appDeploymentWorkflow } = require('./deploy/workflows/app-deployment');
const { meshDeploymentWorkflow } = require('./deploy/workflows/mesh-deployment');

/**
 * Main function - Clean entry point with beautiful master branch formatting
 * Only handles argument processing and workflow delegation
 */
async function main() {
  const args = parseDeployArgs(process.argv.slice(2));

  if (args.help) {
    showDeployHelp();
    return;
  }

  // Step 1: Simple environment detection using shared utility
  const isProd = parseEnvironmentFromArgs(args);

  let result;

  if (args.meshOnly) {
    result = await meshDeploymentWorkflow({ isProd });
  } else {
    result = await appDeploymentWorkflow({
      meshOnly: args.meshOnly,
      isProd,
    });
  }

  if (!result.success) {
    process.exit(1);
  }
}

if (require.main === module) {
  executeScriptWithExit('deploy', main);
}
