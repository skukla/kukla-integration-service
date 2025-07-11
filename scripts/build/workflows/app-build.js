/**
 * App Build Workflow
 * Extracted from scripts/build.js for domain organization
 * Orchestrates the complete application build process
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const frontendGeneration = require('./frontend-generation');
const meshGeneration = require('./mesh-generation');
const format = require('../../core/formatting');
const { createSpinner } = require('../../core/operations/spinner');
const { capitalize } = require('../../core/utils/string');

const execAsync = promisify(exec);

/**
 * Main application build workflow
 * Coordinates generation and compilation
 * @param {Object} options - Build options
 * @param {boolean} options.skipMesh - Skip mesh generation
 * @param {boolean} options.includeAioAppBuild - Include Adobe I/O App build
 * @param {boolean} options.isProd - Whether building for production
 * @returns {Promise<Object>} Build result
 */
async function appBuildWorkflow(options = {}) {
  const { isProd = false } = options;

  try {
    console.log(format.success('Build started'));

    // Step 1: Environment setup - Simple boolean logic
    const environment = isProd ? 'production' : 'staging';
    const envDisplay = capitalize(environment);
    console.log(format.success(`Environment: ${format.environment(envDisplay)}`));

    // Step 2: Frontend Generation
    const frontendSpinner = createSpinner('Generating frontend assets...');
    await frontendGeneration.generateFrontendConfig();
    frontendSpinner.succeed('Frontend assets generated');

    // Step 3: Mesh Resolver Generation (if not skipped)
    let meshStepMessage = 'Mesh generation skipped';
    let meshRegenerated = false;
    if (!options.skipMesh) {
      const meshSpinner = createSpinner('Generating mesh resolver...');
      const meshResult = await meshGeneration.generateMeshResolver({ isProd });
      const meshMessage = meshResult.generated ? 'Mesh resolver generated' : `Mesh resolver: ${meshResult.reason}`;
      meshSpinner.succeed(meshMessage);
      meshStepMessage = meshMessage;
      meshRegenerated = meshResult.generated;
    }

    // Step 4: Adobe I/O App Build (if requested)
    if (options.includeAioAppBuild) {
      const aioSpinner = createSpinner('Building Adobe I/O App...');
      await execAsync('aio app build');
      aioSpinner.succeed('Adobe I/O App built');
    }

    console.log(format.success('Build completed'));

    return {
      success: true,
      environment,
      meshRegenerated,
      steps: [
        `Environment: ${envDisplay}`,
        'Frontend assets generated',
        meshStepMessage,
        ...(options.includeAioAppBuild ? ['Adobe I/O App built'] : []),
      ],
    };

  } catch (error) {
    console.log(format.error('Build failed: ' + error.message));
    throw error;
  }
}

module.exports = {
  appBuildWorkflow,
};
