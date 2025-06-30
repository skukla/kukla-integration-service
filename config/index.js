/**
 * Configuration loader - organized by mental model
 * @module config
 */

const dotenv = require('dotenv');

const { detectEnvironment } = require('../src/core/environment');

// Load environment variables
dotenv.config();

/**
 * Override configuration values from environment variables or action parameters
 * @param {Object} config - Configuration object to update
 * @param {Object} params - Action parameters
 * @param {Object} overrides - Map of config paths to environment variable names
 */
function applyConfigOverrides(config, params, overrides) {
  for (const [configPath, envVar] of Object.entries(overrides)) {
    // Split the config path into parts (e.g., 'commerce.baseUrl' -> ['commerce', 'baseUrl'])
    const parts = configPath.split('.');

    // Create nested objects if they don't exist
    let current = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Override the value if it exists in params or env
    if (params[envVar] || process.env[envVar]) {
      current[parts[parts.length - 1]] = params[envVar] || process.env[envVar];
    }
  }
}

/**
 * Load configuration with clean mental model organization
 * @param {Object} [params] - Action parameters from Adobe I/O Runtime
 * @param {Object} [options] - Loading options
 * @param {boolean} [options.validate=false] - Whether to validate configuration against schema
 * @returns {Object} Complete organized configuration
 */
function loadConfig(params = {}, options = {}) {
  // Detect environment using shared utility
  const env = detectEnvironment(params);

  // Load environment-specific configuration
  let config;
  try {
    config = require(`./environments/${env}`);
  } catch (error) {
    console.warn(`Failed to load ${env} config, falling back to staging`);
    config = require('./environments/staging');
  }

  // Define configuration overrides
  const configOverrides = {
    'commerce.baseUrl': 'COMMERCE_BASE_URL',
    'commerce.credentials.username': 'COMMERCE_ADMIN_USERNAME',
    'commerce.credentials.password': 'COMMERCE_ADMIN_PASSWORD',
    'mesh.endpoint': 'API_MESH_ENDPOINT',
    'mesh.apiKey': 'MESH_API_KEY',
    'runtime.url': env === 'production' ? 'RUNTIME_URL_PRODUCTION' : 'RUNTIME_URL_STAGING',
    'storage.s3.credentials.accessKeyId': 'AWS_ACCESS_KEY_ID',
    'storage.s3.credentials.secretAccessKey': 'AWS_SECRET_ACCESS_KEY',
  };

  // Apply all overrides at once
  applyConfigOverrides(config, params, configOverrides);

  // Optional schema validation
  if (options.validate) {
    try {
      const { validateConfig } = require('./schema');
      validateConfig(config);
    } catch (error) {
      console.warn(`Configuration validation failed: ${error.message}`);
      // Don't throw - just warn for now to maintain compatibility
    }
  }

  return config;
}

/**
 * Load and validate configuration
 * @param {Object} [params] - Action parameters from Adobe I/O Runtime
 * @returns {Object} Validated configuration
 */
function loadValidatedConfig(params = {}) {
  return loadConfig(params, { validate: true });
}

module.exports = {
  loadConfig,
  loadValidatedConfig,
};
