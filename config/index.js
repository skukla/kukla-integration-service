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

/**
 * Loads environment-specific configuration
 * @param {string} [env] - Environment name (development, staging, production)
 * @returns {Object} Environment configuration
 */
function loadEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  try {
    return require(`./environments/${env}`);
  } catch (error) {
    console.warn(`No configuration found for environment: ${env}`);
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
  // Initialize validator
  const ajv = initializeValidator();

  // Load environment-specific configuration
  const envConfig = loadEnvironmentConfig();

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

  return config;
}

// Export configuration API
module.exports = {
  loadConfig,
  validateConfig,
  loadEnvironmentConfig,
  loadSensitiveConfig,
};
