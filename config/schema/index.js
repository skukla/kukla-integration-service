/**
 * Simplified configuration schema index
 * @module config/schema
 */

const apiSchemas = require('./api.schema');
const coreConfigSchema = require('./core.schema');

// Main configuration schema (matches our actual config structure)
const configSchema = coreConfigSchema;

// Validation function for configuration
function validateConfig(config) {
  const Ajv = require('ajv');
  const addFormats = require('ajv-formats');

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const validate = ajv.compile(configSchema);
  const valid = validate(config);

  if (!valid) {
    throw new Error(`Configuration validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  return config;
}

// Frontend configuration validation
function validateFrontendConfig(config) {
  const Ajv = require('ajv');
  const addFormats = require('ajv-formats');

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const validate = ajv.compile(apiSchemas.frontendConfigSchema);
  const valid = validate(config);

  if (!valid) {
    throw new Error(`Frontend configuration validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  return config;
}

// Get schema for specific action
function getActionSchema(actionName) {
  return apiSchemas.actions[actionName] || null;
}

module.exports = {
  // Core schemas
  configSchema,
  apiSchemas,

  // Validation functions
  validateConfig,
  validateFrontendConfig,
  getActionSchema,

  // Individual schemas for direct access
  core: coreConfigSchema,
  api: apiSchemas,
};
