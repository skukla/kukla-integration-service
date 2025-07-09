/**
 * Build Configuration Generation Operations
 * Mid-level operations for generating frontend configuration files
 */

const fs = require('fs');

const { loadConfig } = require('../../../config');
const core = require('../../core');

/**
 * Ensure output directory exists
 * @param {string} outputDir - Output directory path
 */
function ensureOutputDirectory(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Load configuration with environment detection and spinner feedback
 * @param {boolean} useSpinners - Whether to show spinner progress
 * @returns {Promise<Object>} Configuration and environment
 */
async function loadConfigWithEnvironment(useSpinners) {
  const configSpinner = useSpinners ? core.createSpinner('Loading configuration...') : null;
  const env = core.detectScriptEnvironment({}, { allowCliDetection: true });
  const config = loadConfig({ NODE_ENV: env });
  
  if (configSpinner) {
    configSpinner.succeed(core.formatSpinnerSuccess('Configuration loaded'));
  }

  return { config, env };
}

/**
 * Generate frontend configuration object
 * @param {Object} config - Loaded configuration
 * @param {string} env - Environment name
 * @returns {Object} Frontend configuration
 */
function buildFrontendConfig(config, env) {
  return {
    environment: env,
    runtime: {
      package: config.runtime.package,
      version: config.runtime.version,
      url: config.runtime.url,
      paths: config.runtime.paths,
      actions: config.runtime.actions,
    },
    performance: {
      timeout: config.performance.timeouts.api.commerce,
      maxExecutionTime: config.performance.maxExecutionTime,
    },
  };
}

/**
 * Generate URL configuration object
 * @param {Object} config - Loaded configuration
 * @returns {Object} URL configuration
 */
function buildUrlConfig(config) {
  return {
    actions: config.runtime.actions,
    runtime: {
      url: config.runtime.url,
      namespace: config.runtime.namespace,
    },
  };
}

/**
 * Write configuration file with spinner feedback
 * @param {string} filePath - File path to write
 * @param {Object} configData - Configuration data to write
 * @param {string} spinnerMessage - Spinner message
 * @param {string} successMessage - Success message
 * @param {boolean} useSpinners - Whether to show spinner
 */
async function writeConfigFile(filePath, configData, spinnerMessage, successMessage, useSpinners) {
  const spinner = useSpinners ? core.createSpinner(spinnerMessage) : null;
  
  const content = `/* eslint-disable */\nexport default ${JSON.stringify(configData, null, 2)};\n`;
  fs.writeFileSync(filePath, content);
  
  if (spinner) {
    spinner.succeed(core.formatSpinnerSuccess(successMessage));
  }
}

module.exports = {
  ensureOutputDirectory,
  loadConfigWithEnvironment,
  buildFrontendConfig,
  buildUrlConfig,
  writeConfigFile,
}; 
