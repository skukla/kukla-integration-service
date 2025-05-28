/**
 * Configuration module entry point
 * @module config
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const dotenv = require('dotenv');

// Load schemas
const appSchema = require('./schema/app.schema');
const urlSchema = require('./schema/url.schema');
const commerceSchema = require('./schema/commerce.schema');
const securitySchema = require('./schema/security.schema');
const testSchema = require('./schema/test.schema');

// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true, useDefaults: true });
addFormats(ajv);

// Register schemas
ajv.addSchema(appSchema, 'app');
ajv.addSchema(urlSchema, 'url');
ajv.addSchema(commerceSchema, 'commerce');
ajv.addSchema(securitySchema, 'security');
ajv.addSchema(testSchema, 'test');

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
 * Loads sensitive configuration from environment variables
 * @returns {Object} Sensitive configuration
 */
function loadSensitiveConfig() {
  // Load .env file
  dotenv.config();

  return {
    security: {
      authentication: {
        commerce: {
          credentials: {
            username: process.env.COMMERCE_ADMIN_USERNAME,
            password: process.env.COMMERCE_ADMIN_PASSWORD,
            token: process.env.COMMERCE_API_TOKEN
          }
        },
        adobe: {
          imsConfig: {
            clientId: process.env.ADOBE_CLIENT_ID,
            clientSecret: process.env.ADOBE_CLIENT_SECRET
          }
        }
      }
    },
    commerce: {
      api: {
        baseUrl: process.env.COMMERCE_URL
      }
    }
  };
}

/**
 * Validates configuration against schema
 * @param {Object} config - Configuration object
 * @param {string} schemaName - Schema name to validate against
 * @throws {Error} If validation fails
 */
function validateConfig(config, schemaName) {
  const validate = ajv.getSchema(schemaName);
  if (!validate(config)) {
    const errors = validate.errors.map(error => {
      return `${error.instancePath} ${error.message}`;
    }).join('\n');
    throw new Error(`Configuration validation failed for ${schemaName}:\n${errors}`);
  }
}

/**
 * Loads and validates all configuration
 * @returns {Object} Complete configuration object
 */
function loadConfig() {
  // Load environment-specific configuration
  const envConfig = loadEnvironmentConfig();
  
  // Load sensitive configuration from environment
  const sensitiveConfig = loadSensitiveConfig();
  
  // Merge configurations with environment-specific overrides
  const config = {
    app: {
      ...require('./defaults/app.defaults'),
      ...envConfig.app
    },
    url: {
      ...require('./defaults/url.defaults'),
      ...envConfig.url
    },
    commerce: {
      ...require('./defaults/commerce.defaults'),
      ...envConfig.commerce,
      ...sensitiveConfig.commerce
    },
    security: {
      ...require('./defaults/security.defaults'),
      ...envConfig.security,
      ...sensitiveConfig.security
    },
    test: {
      ...require('./defaults/test.defaults'),
      ...envConfig.test
    }
  };

  // Validate each configuration section
  validateConfig(config.app, 'app');
  validateConfig(config.url, 'url');
  validateConfig(config.commerce, 'commerce');
  validateConfig(config.security, 'security');
  validateConfig(config.test, 'test');

  return config;
}

// Export configuration API
module.exports = {
  loadConfig,
  validateConfig,
  loadEnvironmentConfig,
  loadSensitiveConfig
}; 