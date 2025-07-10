/**
 * App Build Workflow
 * Extracted from scripts/build.js for domain organization
 * Orchestrates the complete application build process
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const frontendGeneration = require('./frontend-generation');
const meshGeneration = require('./mesh-generation');
const core = require('../../core');
const { capitalize } = require('../operations/string');

const execAsync = promisify(exec);

/**
 * Main application build workflow
 * Coordinates generation and compilation
 * @param {Object} options - Build options
 * @param {boolean} options.skipMesh - Skip mesh generation
 * @param {boolean} options.includeAioAppBuild - Include Adobe I/O App build
 * @param {string} options.environment - Target environment (staging/production)
 * @returns {Promise<Object>} Build result
 */
async function appBuildWorkflow(options = {}) {
  try {
    console.log(core.formatting.success('Build started'));

    // Step 1: Environment Detection (use provided environment or detect)
    const envSpinner = core.createSpinner('Detecting environment...');
    const env = options.environment || core.detectScriptEnvironment();
    const envDisplay = capitalize(env);
    envSpinner.succeed(`Environment detected: ${envDisplay}`);

    // Step 2: Frontend Generation
    const frontendSpinner = core.createSpinner('Generating frontend assets...');
    await frontendGeneration.generateFrontendConfig();
    frontendSpinner.succeed('Frontend assets generated');

    // Step 3: Mesh Resolver Generation (if not skipped)
    let meshStepMessage = 'Mesh generation skipped';
    let meshRegenerated = false;
    if (!options.skipMesh) {
      const meshSpinner = core.createSpinner('Generating mesh resolver...');
      const meshResult = await meshGeneration.generateMeshResolver();
      const meshMessage = meshResult.generated ? 'Mesh resolver generated' : `Mesh resolver: ${meshResult.reason}`;
      meshSpinner.succeed(meshMessage);
      meshStepMessage = meshMessage;
      meshRegenerated = meshResult.generated;
    }

    // Step 4: Adobe I/O App Build (if requested)
    if (options.includeAioAppBuild) {
      const aioSpinner = core.createSpinner('Building Adobe I/O App...');
      await execAsync('aio app build');
      aioSpinner.succeed('Adobe I/O App built');
    }

    console.log(core.formatting.success('Build completed'));

    return {
      success: true,
      environment: env,
      meshRegenerated,
      steps: [
        'Environment detected',
        'Frontend assets generated',
        meshStepMessage,
        ...(options.includeAioAppBuild ? ['Adobe I/O App built'] : []),
      ],
    };

  } catch (error) {
    console.log(core.formatting.error('Build failed: ' + error.message));
    throw error;
  }
}

module.exports = {
  appBuildWorkflow,
};
