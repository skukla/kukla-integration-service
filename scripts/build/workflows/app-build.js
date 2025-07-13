/**
 * App Build Workflow
 * Clean, consolidated build process without verbose step output
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const frontendGeneration = require('./frontend-generation');
const { capitalize } = require('../../core/utils/string');
const { meshCoreOperations } = require('../operations');

const execAsync = promisify(exec);

/**
 * Main application build workflow with consolidated output
 * @param {Object} options - Build options
 * @param {boolean} options.skipMesh - Skip mesh generation
 * @param {boolean} options.includeAioAppBuild - Include Adobe I/O App build
 * @param {boolean} options.isProd - Whether building for production
 * @returns {Promise<Object>} Build result
 */
async function appBuildWorkflow(options = {}) {
  const { isProd = false } = options;

  try {
    // Step 1: Environment setup
    const environment = isProd ? 'production' : 'staging';
    const envDisplay = capitalize(environment);

    // Step 2: Frontend Generation (silent)
    await frontendGeneration.generateFrontendConfig();

    // Step 3: Mesh Resolver Generation (if not skipped)
    let meshRegenerated = false;
    if (!options.skipMesh) {
      
      const meshResult = await meshCoreOperations.generateMeshCore({ isProd });
      meshRegenerated = meshResult.generated;
    }

    // Step 4: Adobe I/O App Build (if requested)
    if (options.includeAioAppBuild) {
      await execAsync('aio app build');
    }

    return {
      success: true,
      environment,
      meshRegenerated,
      steps: [
        `Environment: ${envDisplay}`,
        'Frontend assets generated',
        meshRegenerated ? 'Mesh resolver regenerated' : 'Mesh resolver unchanged',
        ...(options.includeAioAppBuild ? ['Adobe I/O App built'] : []),
      ],
    };

  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
}

module.exports = {
  appBuildWorkflow,
};
