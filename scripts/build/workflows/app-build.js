/**
 * App Build Workflow
 * Clean, consolidated build process without verbose step output
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const frontendGeneration = require('./frontend-generation');
const { generateMeshCore } = require('../operations/mesh-core-operations');

const execAsync = promisify(exec);

/**
 * Main application build workflow with consolidated output
 * @param {Object} options - Build options
 * @param {boolean} options.skipMesh - Skip mesh generation
 * @param {boolean} options.includeAioAppBuild - Include Adobe I/O App build
 * @param {boolean} options.isProd - Whether building for production
 * @param {boolean} options.silent - Whether to suppress output
 * @returns {Promise<Object>} Build result
 */
async function appBuildWorkflow(options = {}) {
  const { 
    skipMesh = false, 
    includeAioAppBuild = true, 
    isProd = false,
    silent = false, 
  } = options;

  try {
    // Step 1: Frontend generation
    const frontendResult = await frontendGeneration.generateFrontendConfig({
      isProd,
    });

    if (!frontendResult.success) {
      throw new Error(`Frontend generation failed: ${frontendResult.error}`);
    }

    // Step 2: Mesh generation (if not skipped)
    let meshResult = { generated: false };
    if (!skipMesh) {
      meshResult = await generateMeshCore({ isProd });
      if (!meshResult.success) {
        throw new Error(`Mesh generation failed: ${meshResult.error}`);
      }
    }

    // Step 3: Adobe I/O App build (if included)
    if (includeAioAppBuild) {
      if (!silent) {
        console.log('Running Adobe I/O App build...');
      }
      await execAsync('aio app build');
    }

    return {
      success: true,
      meshRegenerated: meshResult.generated,
      frontendResult,
      meshResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      meshRegenerated: false,
    };
  }
}

module.exports = {
  appBuildWorkflow,
};
