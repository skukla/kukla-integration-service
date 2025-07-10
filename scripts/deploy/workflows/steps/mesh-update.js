/**
 * Mesh Update Step
 * Handles updating the API Mesh when needed
 */

// Direct imports to avoid scripts index import issues
const { updateMeshWithRetry } = require('../../../core/operations/mesh');
const format = require('../../../format');

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

  // Update mesh with adjusted timing for 90s deployment window
  const meshUpdateSuccess = await updateMeshWithRetry({
    isProd,
    waitTimeSeconds: isProd ? 60 : 45, // Production: 60s intervals, Staging: 45s intervals
    maxStatusChecks: isProd ? 3 : 3, // Both: 3 checks (allows for ~180s total for prod, ~135s for staging)
  });

  if (!meshUpdateSuccess) {
    console.log(format.warning('Mesh update failed, but deployment completed successfully.'));
    console.log(format.info(`You may need to run: npm run deploy:mesh${isProd ? ':prod' : ''}`));

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
