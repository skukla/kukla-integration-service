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

dotenv.config();

/**
 * Load configuration from all domains
 * @param {Object} [params] - Action parameters
 * @returns {Object} Complete configuration
 */
function loadConfig(params = {}) {
  const commerceConfig = buildCommerceConfig(params);
  const productsConfig = buildProductsConfig();
  const filesConfig = buildFilesConfig(params);
  const runtimeConfig = buildRuntimeConfig(params);
  const meshConfig = buildMeshConfig(params);
  const performanceConfig = buildPerformanceConfig();

  return {
    // Business domains
    commerce: commerceConfig,
    products: productsConfig,

    // Files domain includes storage settings
    storage: filesConfig.storage,
    categories: filesConfig.categories,

    // Infrastructure domains
    runtime: runtimeConfig,
    mesh: meshConfig,
    performance: performanceConfig,
  };
}

/**
 * Load configuration with basic validation
 */
function loadValidatedConfig(params = {}) {
  const config = loadConfig(params);

  // Just check that critical URLs exist
  if (!config.commerce.baseUrl) {
    console.warn('Missing commerce.baseUrl');
  }

  return config;
}

module.exports = {
  loadConfig,
  loadValidatedConfig,
};
