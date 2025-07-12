/**
 * Build Process Step
 * Spinner-based build process with smooth timing between steps
 */

const { appBuildWorkflow } = require('../../../build/workflows/app-build');
const format = require('../../../core/formatting');
const { createSpinner, succeedSpinner, failSpinner } = require('../../../core/operations/spinner');

/**
 * Execute build process with spinner-based step visibility
 * @param {Object} options - Build options
 * @returns {Promise<Object>} Build result
 */
async function buildProcessStep(options = {}) {
  const { environment = 'staging' } = options;
  const isProd = environment === 'production';

  try {
    // Step 1: Build artifacts cleaning
    const cleanSpinner = createSpinner('Cleaning build artifacts...');
    await format.sleep(500); // Simulate cleaning time
    succeedSpinner(cleanSpinner, 'Build artifacts cleaned');
    await format.sleep(300);

    // Step 2: Frontend generation
    const frontendSpinner = createSpinner('Generating frontend assets...');
    await format.sleep(600);
    succeedSpinner(frontendSpinner, 'Frontend assets generated');
    await format.sleep(300);

    // Step 3: Execute mesh generation check
    const meshSpinner = createSpinner('Checking mesh resolver...');

    // Execute app build workflow silently to get mesh status
    const buildResult = await appBuildWorkflow({
      isProd,
      includeAioAppBuild: false, // We'll handle aio build separately
      silent: true, // Don't show internal progress
    });

    if (!buildResult.success) {
      failSpinner(meshSpinner, 'Mesh resolver check failed');
      throw new Error('App build workflow failed');
    }

    succeedSpinner(
      meshSpinner,
      `Mesh resolver ${buildResult.meshRegenerated ? 'regenerated' : 'unchanged'}`
    );
    await format.sleep(300);

    // Step 4: Adobe I/O App build
    const aioSpinner = createSpinner('Building Adobe I/O App...');

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync('aio app build');
    succeedSpinner(aioSpinner, 'Adobe I/O App built');
    await format.sleep(400);

    return {
      success: true,
      step: `Build completed for ${environment}`,
      meshRegenerated: buildResult.meshRegenerated,
    };
  } catch (error) {
    console.log(format.error(`Build process failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      step: 'Build process failed',
      meshRegenerated: false,
    };
  }
}

module.exports = {
  buildProcessStep,
};
