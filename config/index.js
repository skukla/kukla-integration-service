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
  const appSchema = require('./schema/app.schema');
  const commerceSchema = require('./schema/commerce.schema');
  const securitySchema = require('./schema/security.schema');
  const storageSchema = require('./schema/storage.schema');
  const urlSchema = require('./schema/url.schema');

  // Register required schemas
  ajv.addSchema(appSchema, 'app');
  ajv.addSchema(urlSchema, 'url');
  ajv.addSchema(commerceSchema, 'commerce');
  ajv.addSchema(securitySchema, 'security');
  ajv.addSchema(storageSchema, 'storage');

  // Register optional testing schemas if they exist
  const apiTestSchema = require('./schema/api-testing.schema');
  const performanceSchema = require('./schema/performance-testing.schema');
  ajv.addSchema(apiTestSchema, 'api-test');
  ajv.addSchema(performanceSchema, 'performance');

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
  const commerceUrl = params.COMMERCE_URL || process.env.COMMERCE_URL;

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
    url: {
      commerce: {
        baseUrl: commerceUrl,
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
    url: {
      runtime: {
        baseUrl: 'https://localhost:9080',
        namespace: 'local',
        package: 'kukla-integration-service',
        version: 'v1',
      },
      commerce: {
        baseUrl: sensitiveConfig.url.commerce.baseUrl || 'https://your-commerce-instance.com',
        version: 'V1',
        paths: {
          products: '/products',
          categories: '/categories',
          inventory: '/inventory/:sku/source-items',
        },
      },
    },
    commerce: {
      ...envConfig.commerce,
      ...sensitiveConfig.commerce,
    },
    security: {
      ...envConfig.security,
      ...sensitiveConfig.security,
    },
    storage: {
      csv: {
        chunkSize: 100,
        compressionLevel: 6,
        streamBufferSize: 16384,
      },
    },
    testing: {
      api: envConfig.testing?.api,
      performance: envConfig.testing?.performance,
    },
  };

  // Validate required configuration sections
  validateConfig(ajv, config.app, 'app');
  validateConfig(ajv, config.url, 'url');
  validateConfig(ajv, config.commerce, 'commerce');
  validateConfig(ajv, config.security, 'security');
  validateConfig(ajv, config.storage, 'storage');

  // Validate optional testing configuration if it exists
  if (config.testing?.api) {
    validateConfig(ajv, config.testing.api, 'api-test', false);
  }
  if (config.testing?.performance) {
    validateConfig(ajv, config.testing.performance, 'performance', false);
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
