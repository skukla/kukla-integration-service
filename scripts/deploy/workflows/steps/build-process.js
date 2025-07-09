/**
 * Build Process Step
 * Handles the application build process
 */

const { operations } = require('../../../');
const { build } = require('../../../');

/**
 * Execute build process with user feedback
 * @param {Object} options - Build options
 * @param {boolean} options.skipBuild - Whether to skip build
 * @param {boolean} options.skipMesh - Whether to skip mesh generation
 * @returns {Promise<Object>} Build result
 */
async function buildProcessStep(options = {}) {
  const { skipBuild = false, skipMesh = false } = options;

  if (skipBuild) {
    return {
      success: true,
      skipped: true,
      step: 'Build skipped',
    };
  }

  const buildSpinner = operations.spinner.createSpinner('Running build process...');

  await build.workflows.appBuild.appBuildWorkflow({ includeAioAppBuild: false, skipMesh });

  buildSpinner.succeed(operations.spinner.formatSpinnerSuccess('Build process completed'));
  await operations.sleep(300);

  return {
    success: true,
    step: 'Build completed',
  };
}

module.exports = {
  buildProcessStep,
};
