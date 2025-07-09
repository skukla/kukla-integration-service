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
const { buildMainConfig } = require('./domains/main');
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
  // 🎯 MAIN CONFIG: Shared business settings only
  const mainConfig = buildMainConfig();

  // 🏗️ BUILD DOMAINS: Only pass mainConfig to domains that need shared business settings
  const commerceConfig = buildCommerceConfig(params);
  const productsConfig = buildProductsConfig();
  const filesConfig = buildFilesConfig(params, mainConfig); // Needs CSV filename
  const runtimeConfig = buildRuntimeConfig(params);
  const meshConfig = buildMeshConfig(params);
  const performanceConfig = buildPerformanceConfig(); // Self-contained
  const testingConfig = buildTestingConfig(params, mainConfig); // Needs expected product count
  const uiConfig = buildUiConfig();

  return {
    // 🎯 SHARED CORE: Business settings only
    main: mainConfig,

    // 🏗️ BUSINESS DOMAINS
    commerce: commerceConfig,
    products: productsConfig,

    // 📁 STORAGE CONFIGURATION (combined from main and files domains)
    storage: {
      provider: mainConfig.storage.provider, // From main domain
      directory: mainConfig.storage.directory, // From main domain
      ...filesConfig.storage, // File-specific storage settings
    },
    files: {
      extensions: filesConfig.extensions,
      contentTypes: filesConfig.contentTypes,
      processing: filesConfig.processing,
    },

    // 🔧 INFRASTRUCTURE DOMAINS
    runtime: runtimeConfig,
    mesh: meshConfig,
    performance: performanceConfig,
    testing: testingConfig,

    // 🎨 FRONTEND DOMAIN
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
