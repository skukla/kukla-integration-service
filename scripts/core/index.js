/**
 * Scripts Core Infrastructure Catalog
 * @module scripts/core
 *
 * This catalog exports essential shared infrastructure used across script domains:
 * - Environment detection and management
 * - Spinner and UI operations
 * - Script framework utilities
 * - Simple formatting functions
 *
 * Following Strategic Duplication approach - domain-specific utilities moved to their domains,
 * only truly shared infrastructure remains in core.
 *
 */

// Import modules
const format = require('./formatting');
const environment = require('./operations/environment');
const scriptFramework = require('./operations/script-framework');
const spinner = require('./operations/spinner');

/**
 * Environment detection with UI feedback - Shared across workflows
 * @param {Object} [params={}] - Parameters object (can contain NODE_ENV override)
 * @param {Object} [options={}] - Detection options
 * @param {boolean} [options.silent=false] - Suppress UI output (for raw mode)
 * @param {boolean} [options.allowCli=true] - Allow CLI workspace detection
 * @returns {string} Detected environment (staging/production)
 */
function handleEnvironmentDetection(params = {}, options = {}) {
  const { silent = false, allowCli = true } = options;
  const processedParams = { ...params };

  if (!processedParams.NODE_ENV && !process.env.NODE_ENV) {
    if (!silent) {
      const envSpinner = spinner.createSpinner('Detecting workspace environment...');
      try {
        processedParams.NODE_ENV = environment.detectScriptEnvironment(processedParams, {
          allowCliDetection: allowCli,
        });
        const capitalizedEnv =
          processedParams.NODE_ENV.charAt(0).toUpperCase() + processedParams.NODE_ENV.slice(1);
        envSpinner.stop();

        console.log(format.success(`Environment detected: ${format.environment(capitalizedEnv)}`));
      } catch (error) {
        envSpinner.fail('Environment detection failed, defaulting to production');
        processedParams.NODE_ENV = 'production';
      }
    } else {
      processedParams.NODE_ENV = environment.detectScriptEnvironment(processedParams, {
        allowCliDetection: allowCli,
      });
    }
  }

  return processedParams.NODE_ENV;
}

module.exports = {
  // Environment utilities
  detectEnvironment: environment.detectScriptEnvironment,
  detectScriptEnvironment: environment.detectScriptEnvironment,
  handleEnvironmentDetection, // New shared utility

  // Script framework
  parseArgs: scriptFramework.parseArgs,
  executeScript: scriptFramework.executeScript,

  // Spinner operations
  createSpinner: spinner.createSpinner,
  updateSpinner: spinner.updateSpinner,
  succeedSpinner: spinner.succeedSpinner,
  failSpinner: spinner.failSpinner,
  warnSpinner: spinner.warnSpinner,

  // Structured exports for organized access
  environment,
  spinner,
  scriptFramework,

  // Simple formatting functions (Light DDD compliant)
  formatting: format,
};
