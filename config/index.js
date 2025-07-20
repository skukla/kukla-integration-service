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
const { buildScriptsConfig } = require('./domains/scripts');
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
 * Action-specific configuration profiles
 * Define which config domains each action type needs
 */
const ACTION_CONFIG_PROFILES = {
  // File actions only need file-related configs
  'browse-files': ['main', 'storage', 'files', 'runtime', 'performance', 'ui'],
  'download-file': ['main', 'storage', 'files', 'runtime', 'performance'],
  'delete-file': ['main', 'storage', 'files', 'runtime', 'performance'],

  // Product actions need commerce + export configs
  'get-products': ['main', 'commerce', 'products', 'storage', 'files', 'runtime', 'performance'],
  'get-products-mesh': [
    'main',
    'commerce',
    'products',
    'storage',
    'files',
    'runtime',
    'performance',
    'mesh',
  ],

  // Health check needs minimal config
  health: ['main', 'runtime'],

  // Scripts need script-specific configs
  scripts: ['main', 'runtime', 'performance', 'scripts', 'testing'],

  // Default profile for unknown actions
  default: ['main', 'runtime', 'performance'],
};

/**
 * Load configuration based on action requirements
 * @param {Object} [params] - Action parameters
 * @param {boolean} [isProd] - Whether loading for production environment
 * @param {string} [actionName] - Name of the action requesting config
 * @returns {Object} Action-specific configuration
 */
function loadConfig(params = {}, isProd = false, actionName = null) {
  // Determine which config domains this action needs
  const requiredDomains = getRequiredConfigDomains(actionName, params);

  // Build only the required configurations
  const config = buildRequiredConfigurations(requiredDomains, params, isProd);

  return config;
}

/**
 * Determine required config domains for an action
 * @param {string} actionName - Name of the action
 * @param {Object} params - Action parameters that might indicate config needs
 * @returns {Array} Array of required config domain names
 */
function getRequiredConfigDomains(actionName, params) {
  // Try to detect action name from params if not provided
  if (!actionName && params.__ow_headers && params.__ow_headers['x-action-name']) {
    actionName = params.__ow_headers['x-action-name'];
  }

  // Get profile for this action, or use default
  const profile = ACTION_CONFIG_PROFILES[actionName] || ACTION_CONFIG_PROFILES['default'];

  console.info(`Loading config profile for '${actionName || 'unknown'}': [${profile.join(', ')}]`);

  return profile;
}

/**
 * Build only the required configuration domains
 * @param {Array} requiredDomains - List of config domains to build
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether loading for production
 * @returns {Object} Configuration with only required domains
 */
function buildRequiredConfigurations(requiredDomains, params, isProd) {
  const config = {};

  // Always build main config first (others may depend on it)
  const mainConfig = buildMainConfig();
  if (requiredDomains.includes('main')) {
    config.main = mainConfig;
  }

  // Build each required domain
  requiredDomains.forEach((domain) => {
    switch (domain) {
      case 'main':
        // Already handled above
        break;

      case 'commerce':
        config.commerce = buildCommerceConfig(params);
        break;

      case 'products':
        config.products = buildProductsConfig();
        break;

      case 'files': {
        const filesConfig = buildFilesConfig(params, mainConfig);
        config.files = {
          extensions: filesConfig.extensions,
          contentTypes: filesConfig.contentTypes,
          processing: filesConfig.processing,
        };
        // Merge file storage config with main storage config
        if (requiredDomains.includes('storage') || !config.storage) {
          config.storage = {
            ...mainConfig.storage,
            ...filesConfig.storage,
          };
        }
        break;
      }

      case 'storage':
        if (!config.storage) {
          config.storage = mainConfig.storage;
        }
        break;

      case 'runtime':
        config.runtime = buildRuntimeConfig(params);
        break;

      case 'mesh':
        config.mesh = buildMeshConfig(params);
        break;

      case 'performance':
        config.performance = buildPerformanceConfig();
        break;

      case 'scripts':
        config.scripts = buildScriptsConfig(params, isProd);
        break;

      case 'testing':
        config.testing = buildTestingConfig(params, mainConfig);
        break;

      case 'ui':
        config.ui = buildUiConfig();
        break;

      default:
        console.warn(`Unknown config domain requested: ${domain}`);
    }
  });

  return config;
}

/**
 * Load configuration with validation for required values
 * @param {Object} params - Action parameters (optional)
 * @param {boolean} [isProd] - Whether loading for production environment
 * @returns {Object} Complete configuration object
 * @throws {Error} If required configuration is missing
 */
function loadValidatedConfig(params = {}, isProd = false) {
  const config = loadConfig(params, isProd);

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
