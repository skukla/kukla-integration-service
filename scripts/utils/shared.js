/**
 * Shared utilities for Adobe App Builder scripts
 * Consolidates common formatting, parsing, and utility functions
 */

const chalk = require('chalk');
const ora = require('ora');

// Consolidated formatting utilities used across build, deploy, and test scripts
const format = {
  success: (message) => chalk.green(`✔ ${message}`),
  majorSuccess: (message) => chalk.green(`✅ ${message}`),
  error: (message) => chalk.red(`✖ ${message}`),
  warning: (message) => chalk.yellow(`⚠ ${message}`),
  deploymentStart: (message) => `🚀 ${message}`,
  deploymentAction: (message) => `🔧 ${message}`,
  celebration: (message) => `🎉 ${message}`,
  environment: (env) => env.charAt(0).toUpperCase() + env.slice(1),
  muted: (message) => chalk.gray(message),

  // Test-specific formatters
  url: (url) => `🔗 URL: ${chalk.blue(url)}`,
  downloadHeader: (header) => chalk.cyan.bold(header),
  downloadUrl: (url) => chalk.blue.underline(url),
  status: (status, code) => {
    const color = code >= 200 && code < 300 ? 'green' : 'red';
    return chalk[color](`Status: ${status.toUpperCase()} (${code})`);
  },
  storage: (info) => `💾 Storage: ${chalk.cyan(info)}`,

  // Async utility
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Parse command line arguments consistently across scripts
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed arguments object
 */
function parseArgs(args) {
  const parsed = { params: {} };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      parsed[key] = value || true;
    } else if (!parsed.action && !parsed.type) {
      parsed.action = arg;
    }
  }

  return parsed;
}

/**
 * Execute async function with spinner for better UX
 * @param {string} spinnerText - Text to show while spinning
 * @param {Function} asyncFn - Async function to execute
 * @returns {Promise} Result of async function
 */
async function withSpinner(spinnerText, asyncFn) {
  const spinner = ora({
    text: format.muted(spinnerText),
    spinner: 'dots',
  }).start();

  try {
    const result = await asyncFn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    console.log(format.error(`Failed: ${error.message}`));
    throw error;
  }
}

/**
 * Get environment from arguments, defaulting to staging
 * @param {Object} args - Parsed arguments
 * @returns {string} Environment name
 */
function getEnvironment(args) {
  return args.environment === 'production' ? 'production' : 'staging';
}

/**
 * Determine if running in production based on various argument patterns
 * @param {Object} args - Parsed arguments
 * @returns {boolean} True if production environment
 */
function isProdEnvironment(args) {
  return args.environment === 'production' || args.prod === true;
}

module.exports = {
  format,
  parseArgs,
  withSpinner,
  getEnvironment,
  isProdEnvironment,
};
