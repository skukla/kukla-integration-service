/**
 * Mesh Update Step
 * Handles API Mesh updates when needed
 */

const chalk = require('chalk');

const { operations } = require('../../../');

/**
 * Update API Mesh if needed
 * @param {Object} options - Update options
 * @param {boolean} options.isProd - Whether in production
 * @param {boolean} options.skipMesh - Whether to skip mesh updates
 * @param {Object} options.meshStatus - Mesh status from previous check
 * @returns {Promise<Object>} Update result
 */
async function meshUpdateStep(options = {}) {
  const { isProd = false, skipMesh = false, meshStatus = {} } = options;

  if (skipMesh) {
    return {
      success: true,
      skipped: true,
      step: 'Mesh update skipped',
    };
  }

  if (!meshStatus.wasRegenerated) {
    return {
      success: true,
      unchanged: true,
      step: 'Mesh unchanged',
    };
  }

  console.log(chalk.blue('\n🔄 Updating API Mesh...\n'));

  const meshUpdateSuccess = await operations.mesh.updateMeshWithRetry({
    isProd,
    waitTimeSeconds: isProd ? 90 : 30,
    maxStatusChecks: isProd ? 10 : 2,
  });

  if (!meshUpdateSuccess) {
    console.log(chalk.yellow('⚠️ Mesh update failed, but deployment completed successfully.'));
    console.log(chalk.yellow(`You may need to run: npm run deploy:mesh${isProd ? ':prod' : ''}`));

    return {
      success: true,
      failed: true,
      step: 'Mesh update failed',
      warning: true,
    };
  }

  return {
    success: true,
    step: 'Mesh updated',
  };
}

module.exports = {
  meshUpdateStep,
};
