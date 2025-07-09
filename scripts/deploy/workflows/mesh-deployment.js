/**
 * Mesh Deployment Workflow
 * Extracted from scripts/update-mesh.js for domain organization
 * Handles standalone API Mesh updates
 */

const chalk = require('chalk');

const { operations } = require('../../');
const { build } = require('../../');

/**
 * Mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Deploy to production
 * @param {boolean} options.skipBuild - Skip build configuration
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { isProd = false, skipBuild = false } = options;
  const environment = isProd ? 'production' : 'staging';

  try {
    console.log(
      chalk.bold.cyan(`\n🚀 Starting API Mesh update for ${environment} environment...\n`)
    );

    // Step 1: Build mesh configuration (if not skipped)
    if (!skipBuild) {
      const buildSpinner = operations.spinner.createSpinner('Building mesh configuration...');
      await build.workflows.frontendGeneration.generateFrontendConfig();
      buildSpinner.succeed(operations.spinner.formatSpinnerSuccess('Mesh configuration built'));
    }

    // Step 2: Update mesh
    const success = await operations.mesh.updateMeshWithRetry({
      isProd,
      waitTimeSeconds: isProd ? 90 : 30,
      maxStatusChecks: isProd ? 10 : 2,
    });

    if (success) {
      console.log(chalk.bold.green('🎉 Mesh update completed successfully!\n'));
      return {
        success: true,
        environment,
        isProd,
        steps: [skipBuild ? 'Build skipped' : 'Configuration built', 'Mesh updated successfully'],
      };
    } else {
      console.log(chalk.bold.red('❌ Mesh update failed. Please check the output above.\n'));
      return {
        success: false,
        environment,
        isProd,
        error: 'Mesh update failed',
      };
    }
  } catch (error) {
    console.error(chalk.red('\nMesh deployment failed. Please see the error messages above.'));
    console.error(chalk.red(error.message));
    throw error;
  }
}

module.exports = {
  meshDeploymentWorkflow,
};
