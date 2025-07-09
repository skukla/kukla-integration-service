/**
 * Main Configuration
 * @module config
 *
 * Domain-driven configuration that composes domain-specific settings.
 * Each domain manages its own configuration concerns.
 */

const dotenv = require('dotenv');

// Domain configuration builders
const { buildCommerceConfig } = require('./domains/commerce');
const { buildFilesConfig } = require('./domains/files');
const { buildMeshConfig } = require('./domains/mesh');
const { buildPerformanceConfig } = require('./domains/performance');
const { buildProductsConfig } = require('./domains/products');
const { buildRuntimeConfig } = require('./domains/runtime');
const { buildTestingConfig } = require('./domains/testing');
const { buildUiConfig } = require('./domains/ui');

dotenv.config();

/**
 * Validate configuration for required values
 * @param {Object} config - Configuration object to validate
 * @param {string} domain - Domain name for error context
 * @throws {Error} If required configuration is missing
 */
function validateRequiredConfig(config, domain) {
  const requiredErrors = [];

  function checkObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string' && value.startsWith('REQUIRED:')) {
        const envVar = value.replace('REQUIRED:', '');
        requiredErrors.push({
          path: currentPath,
          envVar,
          message: `${envVar} is required but not set`,
        });
      } else if (typeof value === 'object' && value !== null) {
        checkObject(value, currentPath);
      }
    }
  }

  checkObject(config);

  if (requiredErrors.length > 0) {
    const errorMessages = requiredErrors
      .map((err) => `• ${err.message} (configure via ${err.envVar} environment variable)`)
      .join('\n');

    throw new Error(`Missing required ${domain} configuration:\n${errorMessages}`);
  }
}

/**
 * Load configuration from all domains
 * @param {Object} [params] - Action parameters
 * @returns {Object} Complete configuration
 */
function loadConfig(params = {}) {
  const commerceConfig = buildCommerceConfig(params);
  const productsConfig = buildProductsConfig(params);
  const filesConfig = buildFilesConfig(params);
  const runtimeConfig = buildRuntimeConfig(params);
  const meshConfig = buildMeshConfig(params);
  const performanceConfig = buildPerformanceConfig(params);
  const testingConfig = buildTestingConfig(params);
  const uiConfig = buildUiConfig(params);

  return {
    // Business domains
    commerce: commerceConfig,
    products: productsConfig,

    // Files domain includes storage settings
    storage: filesConfig.storage,
    files: {
      extensions: filesConfig.extensions,
      contentTypes: filesConfig.contentTypes,
      processing: filesConfig.processing,
      caching: filesConfig.caching,
    },

    // Infrastructure domains
    runtime: runtimeConfig,
    mesh: meshConfig,
    performance: performanceConfig,
    testing: testingConfig,

    // Frontend domain
    ui: uiConfig,
  };
}

/**
 * Load configuration with validation for required values
 * @param {Object} params - Action parameters (optional)
 * @returns {Object} Complete configuration object
 * @throws {Error} If required configuration is missing
 */
function loadValidatedConfig(params = {}) {
  const config = loadConfig(params);

  // Validate each domain for required configuration
  validateRequiredConfig(config.commerce, 'commerce');
  validateRequiredConfig(config.mesh, 'mesh');
  validateRequiredConfig(config.files, 'files');
  validateRequiredConfig(config.runtime, 'runtime');

  return config;
}

module.exports = {
  loadConfig,
  loadValidatedConfig,
};
