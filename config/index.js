/**
 * Configuration module entry point
 * @module config
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const dotenv = require('dotenv');

/**
 * Initializes the JSON Schema validator
 * @returns {Object} Configured Ajv instance
 */
function initializeValidator() {
  const ajv = new Ajv({ allErrors: true, useDefaults: true });
  addFormats(ajv);

  // Load schemas
  const commonPatterns = require('./schema/common.schema');
  const appSchema = require('./schema/app.schema');
  const commerceSchema = require('./schema/commerce.schema');
  const securitySchema = require('./schema/security.schema');
  const storageSchema = require('./schema/storage.schema');
  const urlSchema = require('./schema/url.schema');
  const productSchema = require('./schema/product.schema');
  const testingSchema = require('./schema/testing.schema');

  // Register common patterns first
  ajv.addSchema(commonPatterns, 'common');

  // Register required schemas
  ajv.addSchema(appSchema, 'app');
  ajv.addSchema(urlSchema, 'url');
  ajv.addSchema(commerceSchema, 'commerce');
  ajv.addSchema(securitySchema, 'security');
  ajv.addSchema(storageSchema, 'storage');
  ajv.addSchema(productSchema, 'product');
  ajv.addSchema(testingSchema, 'testing');

  return ajv;
}

// Configuration cache to prevent multiple loads
let configCache = null;
let environmentCache = null;

/**
 * Detects the current environment based on runtime context
 * @returns {string} Environment name (staging, production)
 */
function detectEnvironment() {
  // Return cached environment if already detected
  if (environmentCache) {
    return environmentCache;
  }

  // Method 1: Check OpenWhisk namespace
  const owNamespace = process.env.__OW_NAMESPACE;

  if (owNamespace) {
    // If namespace contains 'stage', it's staging environment
    const containsStage = owNamespace.includes('stage');

    if (containsStage) {
      environmentCache = 'staging';
      return environmentCache;
    }

    // If namespace doesn't contain 'stage' and has the expected production pattern, it's production
    const productionPattern = owNamespace.match(/^\d+-\w+$/);

    if (productionPattern) {
      environmentCache = 'production';
      return environmentCache;
    }
  }

  // Method 2: Check runtime URL context (Adobe I/O Runtime hostnames)
  const runtimeUrl = process.env.__OW_API_HOST;
  if (runtimeUrl) {
    // Check for staging patterns in hostname
    if (runtimeUrl.includes('stage') || runtimeUrl.includes('-stage.')) {
      environmentCache = 'staging';
      return environmentCache;
    }
  }

  // Method 3: Check action name for workspace indicators
  const actionName = process.env.__OW_ACTION_NAME;
  if (actionName && actionName.includes('stage')) {
    environmentCache = 'staging';
    return environmentCache;
  }

  // Method 4: Check explicit NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && ['staging', 'production', 'development'].includes(nodeEnv)) {
    environmentCache = nodeEnv;
    return environmentCache;
  }

  // Default fallback to staging for safer development
  environmentCache = 'staging';
  return environmentCache;
}

/**
 * Loads environment-specific configuration
 * @param {string} [env] - Environment name (staging, production)
 * @param {Object} [params] - Action parameters
 * @returns {Object} Environment configuration
 */
function loadEnvironmentConfig(env = null, params = {}) {
  // Auto-detect environment if not explicitly provided
  if (!env) {
    // Priority 1: Use explicit parameter from app.config.yaml
    if (params.NODE_ENV && ['staging', 'production', 'development'].includes(params.NODE_ENV)) {
      env = params.NODE_ENV;
    } else {
      env = detectEnvironment();
    }
  }

  try {
    const config = require(`./environments/${env}`);
    return config;
  } catch (error) {
    console.error(`Failed to load ${env} configuration:`, error.message);

    // Fallback to staging if production fails
    if (env === 'production') {
      console.warn('Falling back to staging configuration');
      try {
        const stagingConfig = require('./environments/staging');
        return stagingConfig;
      } catch (stagingError) {
        console.error('Critical: Cannot load any configuration');
        return {};
      }
    }

    return {};
  }
}

/**
 * Loads sensitive configuration from environment variables and action parameters
 * @param {Object} [params] - Action parameters
 * @returns {Object} Sensitive configuration
 */
function loadSensitiveConfig(params = {}) {
  // Load .env file
  dotenv.config();

  // Merge environment variables with action parameters, preferring action parameters
  const username = params.COMMERCE_ADMIN_USERNAME || process.env.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD || process.env.COMMERCE_ADMIN_PASSWORD;
  const token = params.COMMERCE_API_TOKEN || process.env.COMMERCE_API_TOKEN;
  const clientId = params.ADOBE_CLIENT_ID || process.env.ADOBE_CLIENT_ID;
  const clientSecret = params.ADOBE_CLIENT_SECRET || process.env.ADOBE_CLIENT_SECRET;

  return {
    security: {
      authentication: {
        commerce: {
          type: 'basic',
          tokenRefresh: {
            enabled: true,
            interval: 3600,
          },
          credentials: {
            username,
            password,
            token,
          },
        },
        adobe: {
          imsConfig: {
            clientId,
            clientSecret,
          },
        },
      },
    },
  };
}

/**
 * Validates configuration against schema if it exists
 * @param {Object} ajv - Ajv instance
 * @param {Object} config - Configuration object
 * @param {string} schemaName - Schema name to validate against
 * @param {boolean} [required=true] - Whether the schema is required
 * @throws {Error} If validation fails for required schemas
 */
function validateConfig(ajv, config, schemaName, required = true) {
  const validate = ajv.getSchema(schemaName);

  // Skip validation if schema doesn't exist and it's not required
  if (!validate && !required) {
    return;
  }

  // Throw error if required schema is missing
  if (!validate && required) {
    throw new Error(`Required schema ${schemaName} not found`);
  }

  if (!validate(config)) {
    const errors = validate.errors
      .map((error) => {
        return `${error.instancePath} ${error.message}`;
      })
      .join('\n');
    throw new Error(`Configuration validation failed for ${schemaName}:\n${errors}`);
  }
}

/**
 * Loads and validates all configuration
 * @param {Object} [params] - Action parameters
 * @returns {Object} Complete configuration object
 */
function loadConfig(params = {}) {
  // Return cached config if available and no new params
  if (configCache && Object.keys(params).length === 0) {
    return configCache;
  }

  // Initialize validator
  const ajv = initializeValidator();

  // Load environment-specific configuration
  const envConfig = loadEnvironmentConfig(null, params);

  // Load sensitive configuration from environment and action parameters
  const sensitiveConfig = loadSensitiveConfig(params);

  // Merge configurations with environment-specific overrides
  const config = {
    app: envConfig.app,
    url: envConfig.url,
    commerce: {
      ...envConfig.commerce,
      ...sensitiveConfig.security?.authentication?.commerce,
    },
    security: {
      ...envConfig.security,
      ...sensitiveConfig.security,
    },
    storage: envConfig.storage,
    testing: envConfig.testing,
  };

  // Validate required configuration sections
  validateConfig(ajv, config.app, 'app');
  validateConfig(ajv, config.url, 'url');
  validateConfig(ajv, config.commerce, 'commerce');
  validateConfig(ajv, config.security, 'security');
  validateConfig(ajv, config.storage, 'storage');

  // Validate testing configuration
  if (config.testing) {
    validateConfig(ajv, config.testing, 'testing');
  }

  // Cache the config only if no dynamic params were provided
  if (Object.keys(params).length === 0) {
    configCache = config;
  }

  return config;
}

// Export configuration API
module.exports = {
  loadConfig,
  validateConfig,
  loadEnvironmentConfig,
  loadSensitiveConfig,
};
