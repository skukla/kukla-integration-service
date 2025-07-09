#!/usr/bin/env node

/**
 * Build Script - Clean Orchestrator Pattern
 * Focuses on WHAT to build, not HOW to parse CLI arguments
 */

const { scriptFramework } = require('./core/operations');

/**
 * Clean business logic for build operations
 * @param {Object} context - Script context with domains and args
 * @returns {Promise<Object>} Build result
 */
async function buildBusinessLogic(context) {
  const { build, args } = context;

  // Step 1: Execute app build workflow with parsed options
  const buildResult = await build.appBuild.appBuildWorkflow({
    includeAioAppBuild: args.includeAioAppBuild,
    skipMesh: args.skipMesh,
  });

  // Step 2: Return result with environment info
  return scriptFramework.success(
    {
      environment: buildResult.environment,
      completed: buildResult.success,
    },
    `Build completed for ${buildResult.environment} environment`
  );
}

// Create script with framework - all CLI parsing handled automatically!
const buildScript = scriptFramework.createScript(buildBusinessLogic, {
  scriptName: 'build',
  domains: ['build'],
  description: 'Build Adobe App Builder application for deployment',
  cliOptions: {
    includeAioAppBuild: {
      flags: ['--aio', '--with-aio'],
      description: 'Include Adobe I/O App build step',
    },
    skipMesh: {
      flags: ['--skip-mesh'],
      description: 'Skip mesh resolver generation',
    },
  },
  examples: [
    'npm run build                    # Standard build',
    'npm run build -- --aio           # Build with Adobe I/O App',
    'npm run build -- --skip-mesh     # Build without mesh generation',
  ],
});

// Export main function for npm scripts
module.exports = buildScript;

// Run if called directly
if (require.main === module) {
  buildScript.main();
}
