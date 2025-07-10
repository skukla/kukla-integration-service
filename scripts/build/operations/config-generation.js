/**
 * Build Configuration Generation Operations
 * Mid-level operations for generating frontend configuration files
 */

const fs = require('fs');

const { loadConfig } = require('../../../config');
const core = require('../../core');

// ensureOutputDirectory moved inline to workflows
// This was a simple 4-line fs operation that didn't warrant separate abstraction

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
    configSpinner.succeed('Configuration loaded');
  }

  return { config, env };
}

// buildFrontendConfig and buildUrlConfig moved inline to workflows
// These were simple object construction operations that didn't warrant separate abstractions

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
    spinner.succeed(successMessage);
  }
}

module.exports = {
  loadConfigWithEnvironment,
  writeConfigFile,
  // ensureOutputDirectory, buildFrontendConfig, and buildUrlConfig moved inline to workflows
}; 
