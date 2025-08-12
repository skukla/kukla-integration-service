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

/**
 * Build Adobe I/O Runtime URL from environment variables
 * @param {boolean} isProd - Whether to use production environment
 * @returns {string} Complete runtime URL
 * @throws {Error} If required environment variables are not set
 */
function buildRuntimeUrl(isProd = false) {
  const namespace = process.env.AIO_runtime_namespace;
  const apiHost = process.env.AIO_runtime_apihost;

  if (!namespace) {
    throw new Error(
      'AIO_runtime_namespace environment variable is required. ' +
        'Run "aio app deploy" or set up your .env file.'
    );
  }

  // Convert namespace for production if needed
  let finalNamespace = namespace;
  if (isProd && namespace.includes('-stage')) {
    finalNamespace = namespace.replace('-stage', '-production');
  }

  // Handle custom or enterprise API hosts
  if (apiHost) {
    const hostBase = apiHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${finalNamespace}.${hostBase}`;
  }

  // Default Adobe I/O Runtime pattern
  return `https://${finalNamespace}.adobeioruntime.net`;
}

/**
 * Get package name from package.json or app.config.yaml
 * @returns {string} Package name
 */
function getPackageName() {
  // Try to get from package.json first
  try {
    const packageJson = require('../../package.json');
    return packageJson.name;
  } catch (e) {
    // Fallback to default if package.json not found
    return 'kukla-integration-service';
  }
}

/**
 * Build action URL for Adobe I/O Runtime actions
 * @param {string} actionName - Name of the action
 * @param {Object} params - Query parameters
 * @param {boolean} isProd - Whether to use production environment
 * @returns {string} Complete action URL
 */
function buildActionUrl(actionName, params = {}, isProd = false) {
  const runtimeUrl = buildRuntimeUrl(isProd);
  const packageName = getPackageName();
  const url = `${runtimeUrl}/api/v1/web/${packageName}/${actionName}`;

  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
  }

  return url;
}

module.exports = {
  format,
  parseArgs,
  withSpinner,
  getEnvironment,
  isProdEnvironment,
  buildRuntimeUrl,
  buildActionUrl,
};
