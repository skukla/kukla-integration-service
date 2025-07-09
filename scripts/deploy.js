#!/usr/bin/env node

/**
 * Deploy Script - Clean Orchestrator Pattern
 * Focuses on WHAT to deploy, not HOW to parse CLI arguments
 */

const { scriptFramework } = require('./core/operations');

/**
 * Clean business logic for deployment operations
 * @param {Object} context - Script context with domains and args
 * @returns {Promise<Object>} Deployment result
 */
async function deployBusinessLogic(context) {
  const { deploy, args } = context;

  // Step 1: Execute deployment workflow with parsed options
  const deployResult = await deploy.appDeployment.appDeploymentWorkflow({
    isProd: args.isProd,
    skipBuild: args.skipBuild,
    skipMesh: args.skipMesh,
    meshOnly: args.meshOnly,
  });

  // Step 2: Return result with environment info
  return scriptFramework.success(
    {
      environment: deployResult.environment,
      completed: deployResult.success,
    },
    `Deployment to ${deployResult.environment} completed successfully`
  );
}

// Create script with framework - all CLI parsing handled automatically!
const deployScript = scriptFramework.createScript(deployBusinessLogic, {
  scriptName: 'deploy',
  domains: ['deploy'],
  description: 'Deploy Adobe App Builder application to staging or production',
  cliOptions: {
    isProd: {
      flags: ['--workspace=Production', '--prod'],
      description: 'Deploy to production workspace',
    },
    skipBuild: {
      flags: ['--skip-build'],
      description: 'Skip build process',
    },
    skipMesh: {
      flags: ['--skip-mesh'],
      description: 'Skip mesh updates',
    },
    meshOnly: {
      flags: ['--mesh-only'],
      description: 'Only update mesh (skip app deployment)',
    },
  },
  examples: [
    'npm run deploy                            # Deploy to staging',
    'npm run deploy -- --workspace=Production # Deploy to production',
    'npm run deploy -- --skip-build           # Deploy without building',
    'npm run deploy -- --mesh-only            # Update mesh only',
  ],
});

// Export main function for npm scripts
module.exports = deployScript;

// Run if called directly
if (require.main === module) {
  deployScript.main();
}
