/**
 * Mesh Update Step
 * Handles updating the API Mesh when needed
 */

// Use mesh domain for all mesh functionality
const format = require('../../../format');
const meshDomain = require('../../../mesh');

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

  try {
    // Use workflow orchestration for mesh compilation
    console.log(format.info('Compiling mesh configuration for deployment...'));

    const compilationResult = await meshDomain.workflows.compile.compileMeshConfig({});

    if (!compilationResult.success) {
      throw new Error(`Mesh compilation workflow failed: ${compilationResult.error}`);
    }

    console.log(format.success('✅ Mesh compilation workflow completed successfully'));

    // Update mesh using compiled configuration
    console.log(format.info('Updating API Mesh with compiled configuration...'));

    const meshUpdateResult = await meshDomain.operations.deployment.updateMeshWithRetry({
      environment: isProd ? 'production' : 'staging',
      pollInterval: isProd ? 60 : 45, // Production: 60s intervals, Staging: 45s intervals
      maxPollChecks: 3, // Both: 3 checks (allows for ~180s total for prod, ~135s for staging)
      onEvent: (event) => {
        // Handle events from mesh operations with proper formatting
        switch (event.type) {
          case 'meshUpdateStart':
            console.log(
              format.info(
                `Starting mesh update (${event.environment}, max ${event.maxRetries} retries)`
              )
            );
            break;
          case 'pollingStart':
            console.log(
              format.info(
                `Polling status every ${event.pollInterval}s (max ${event.maxPollChecks} checks)`
              )
            );
            break;
          case 'statusInfo':
            console.log(
              format.info(`Status check ${event.check}/${event.maxPollChecks}: ${event.status}`)
            );
            break;
          case 'retryWarning':
          case 'statusWarning':
          case 'attemptWarning':
            console.log(format.warning(event.message));
            break;
          default:
            console.log(format.info(event.message));
        }
      },
    });

    if (!meshUpdateResult.success) {
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
      step: 'Mesh updated with template-generated resolver and external GraphQL schemas',
    };
  } catch (error) {
    console.log(format.error(`Mesh update step failed: ${error.message}`));
    throw error;
  }
}

module.exports = {
  meshUpdateStep,
};
