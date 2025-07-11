/**
 * Build Configuration Generation Operations
 * Mid-level operations for generating frontend configuration files
 */

const fs = require('fs');

const { loadConfig } = require('../../../config');
const { createSpinner } = require('../../core/operations/spinner');
const { getEnvironmentString } = require('../../core/utils/environment');

/**
 * Load configuration with environment and spinner feedback
 * @param {boolean} useSpinners - Whether to show spinner progress
 * @param {boolean} isProd - Whether building for production
 * @returns {Promise<Object>} Configuration and environment
 */
async function loadConfigWithEnvironment(useSpinners, isProd = false) {
  const configSpinner = useSpinners ? createSpinner('Loading configuration...') : null;
  const environment = getEnvironmentString(isProd);
  const config = loadConfig({}, isProd);
  
  if (configSpinner) {
    configSpinner.succeed('Configuration loaded');
  }

  return { config, env: environment };
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
  const spinner = useSpinners ? createSpinner(spinnerMessage) : null;
  
  const content = `/* eslint-disable */\nexport default ${JSON.stringify(configData, null, 2)};\n`;
  fs.writeFileSync(filePath, content);
  
  if (spinner) {
    spinner.succeed(successMessage);
  }
}

module.exports = {
  loadConfigWithEnvironment,
  writeConfigFile,
}; 
