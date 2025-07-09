/**
 * App Build Workflow
 * Extracted from scripts/build.js for domain organization
 * Orchestrates the complete application build process
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');

const frontendGeneration = require('./frontend-generation');
const meshGeneration = require('./mesh-generation');
const core = require('../../core');

const execAsync = promisify(exec);

/**
 * Main application build workflow
 * Coordinates generation and compilation
 * @param {Object} options - Build options
 * @param {boolean} options.skipMesh - Skip mesh generation
 * @param {boolean} options.includeAioAppBuild - Include Adobe I/O App build
 * @returns {Promise<Object>} Build result
 */
async function appBuildWorkflow(options = {}) {
  try {
    console.log(chalk.bold.cyan('\n🔨 Starting application build...\n'));

    // Step 1: Environment Detection
    const envSpinner = core.createSpinner('Detecting environment...');
    const env = core.detectScriptEnvironment();
    const envDisplay = chalk.bold(core.capitalize(env));
    envSpinner.succeed(core.formatSpinnerSuccess('Environment detected: ' + envDisplay));

    // Step 2: Frontend Generation
    const frontendSpinner = core.createSpinner('Generating frontend assets...');
    await frontendGeneration.generateFrontendConfig();
    frontendSpinner.succeed(core.formatSpinnerSuccess('Frontend assets generated'));

    // Step 3: Mesh Resolver Generation (if not skipped)
    if (!options.skipMesh) {
      const meshSpinner = core.createSpinner('Generating mesh resolver...');
      await meshGeneration.generateMeshResolver();
      meshSpinner.succeed(core.formatSpinnerSuccess('Mesh resolver generated'));
    }

    // Step 4: Adobe I/O App Build (if requested)
    if (options.includeAioAppBuild) {
      const aioSpinner = core.createSpinner('Building Adobe I/O App...');
      await execAsync('aio app build');
      aioSpinner.succeed(core.formatSpinnerSuccess('Adobe I/O App built'));
    }

    console.log(chalk.bold.green('\n✅ Application build completed successfully!\n'));

    return {
      success: true,
      environment: env,
      steps: [
        'Environment detected',
        'Frontend assets generated',
        options.skipMesh ? 'Mesh generation skipped' : 'Mesh resolver generated',
        ...(options.includeAioAppBuild ? ['Adobe I/O App built'] : []),
      ],
    };

  } catch (error) {
    console.log(chalk.red('Build failed: ' + error.message));
    throw error;
  }
}

module.exports = {
  appBuildWorkflow,
}; 
