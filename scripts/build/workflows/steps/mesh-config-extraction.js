/**
 * Mesh Config Extraction Step
 * Handles extraction of mesh configuration from environment config
 */

const path = require('path');

// Direct imports to avoid scripts index import issues
const { loadConfig } = require('../../../../config');
const { detectScriptEnvironment } = require('../../../core/operations/environment');

/**
 * Extract mesh configuration for resolver generation
 * @returns {Promise<Object>} Mesh config extraction result
 */
async function meshConfigExtractionStep() {
  // Define paths for the template and the final resolver file
  const templatePath = path.join(__dirname, '../../../../mesh-resolvers.template.js');
  const resolverPath = path.join(__dirname, '../../../../mesh-resolvers.js');

  // Load configuration for the current environment with CLI detection
  const env = detectScriptEnvironment({}, { allowCliDetection: true });
  const config = loadConfig({ NODE_ENV: env });

  // Extract mesh configuration properties for injection into resolver
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
    retries: config.performance.retries.api.mesh,
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
