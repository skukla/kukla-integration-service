/**
 * Mesh Config Extraction Step
 * Handles extraction of mesh configuration from environment config
 */

const path = require('path');

const { operations } = require('../../../');
const { loadConfig } = require('../../../../config');

/**
 * Extract mesh configuration for resolver generation
 * @returns {Promise<Object>} Mesh config extraction result
 */
async function meshConfigExtractionStep() {
  // Define paths for the template and the final resolver file
  const templatePath = path.join(__dirname, '../../../../mesh-resolvers.template.js');
  const resolverPath = path.join(__dirname, '../../../../mesh-resolvers.js');

  // Load configuration for the current environment with CLI detection
  const env = operations.environment.detectScriptEnvironment({}, { allowCliDetection: true });
  const config = loadConfig({ NODE_ENV: env });

  // Extract mesh configuration properties for injection into resolver
  const meshConfig = {
    commerceBaseUrl: config.commerce.baseUrl,
    pagination: {
      defaultPageSize: config.commerce.product.pagination.pageSize,
      maxPages: config.commerce.product.pagination.maxPages,
    },
    batching: {
      categories: config.commerce.batching.categories,
      inventory: config.commerce.batching.inventory,
      maxConcurrent: config.performance.batching.maxConcurrent,
      requestDelay: config.performance.batching.requestDelay,
    },
    timeout: config.mesh.timeout,
    retries: config.mesh.retries,
  };

  return {
    success: true,
    templatePath,
    resolverPath,
    config,
    meshConfig,
    environment: env,
  };
}

module.exports = {
  meshConfigExtractionStep,
}; 
