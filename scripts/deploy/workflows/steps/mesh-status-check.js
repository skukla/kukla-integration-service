/**
 * Mesh Status Check Step
 * Handles checking mesh resolver regeneration status
 */

const path = require('path');

const { operations, build } = require('../../../');
const { loadConfig } = require('../../../../config');

/**
 * Check mesh resolver status with user feedback
 * @returns {Promise<Object>} Mesh status result
 */
async function meshStatusCheckStep() {
  const meshCheckSpinner = operations.spinner.createSpinner('Checking mesh resolver status...');

  try {
    // Use the same logic as mesh generation to check if regeneration is needed
    const templatePath = path.join(__dirname, '../../../../mesh-resolvers.template.js');
    const resolverPath = path.join(__dirname, '../../../../mesh-resolvers.js');

    const env = operations.environment.detectScriptEnvironment({}, { allowCliDetection: true });
    const config = loadConfig({ NODE_ENV: env });

    const meshConfig = {
      commerceBaseUrl: config.commerce.baseUrl,
      pagination: {
        defaultPageSize: config.products.pagination.pageSize,
        maxPages: config.products.pagination.maxPages,
      },
      batching: {
        categories: config.commerce.batching.categories,
        inventory: config.commerce.batching.inventory,
        maxConcurrent: config.performance.batching.maxConcurrent,
        requestDelay: config.performance.batching.requestDelay,
      },
      timeout: config.performance.timeouts.api.mesh,
      retries: config.mesh.retries,
    };

    const meshStatus = build.workflows.meshGeneration.needsRegeneration(
      templatePath,
      resolverPath,
      meshConfig
    );

    meshCheckSpinner.succeed(
      operations.spinner.formatSpinnerSuccess(`Mesh resolver: ${meshStatus.reason}`)
    );
    await operations.sleep(500);

    return {
      success: true,
      meshStatus,
      step: `Mesh resolver: ${meshStatus.reason}`,
    };
  } catch (error) {
    meshCheckSpinner.fail(`Mesh status check failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  meshStatusCheckStep,
};
