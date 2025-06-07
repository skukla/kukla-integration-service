/**
 * Configuration loader - organized by mental model
 * @module config
 */

const dotenv = require('dotenv');

const { detectEnvironment } = require('../src/core/environment');

// Load environment variables
dotenv.config();

/**
 * Load configuration with clean mental model organization
 * @param {Object} [params] - Action parameters from Adobe I/O Runtime
 * @returns {Object} Complete organized configuration
 */
function loadConfig(params = {}) {
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

  // Add credentials from environment or action parameters
  if (!config.commerce.credentials) {
    config.commerce.credentials = {};
  }

  config.commerce.credentials.username =
    params.COMMERCE_ADMIN_USERNAME || process.env.COMMERCE_ADMIN_USERNAME;
  config.commerce.credentials.password =
    params.COMMERCE_ADMIN_PASSWORD || process.env.COMMERCE_ADMIN_PASSWORD;

  if (!config.storage.s3.credentials) {
    config.storage.s3.credentials = {};
  }

  config.storage.s3.credentials.accessKeyId =
    params.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  config.storage.s3.credentials.secretAccessKey =
    params.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  return config;
}

module.exports = { loadConfig };
