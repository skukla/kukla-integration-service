/**
 * Environment detection operations
 * @module core/environment/operations/detection
 */

/**
 * Performs standard environment detection using parameters and environment variables
 * @param {Object} params - Action parameters
 * @returns {string|null} Environment name or null if not detected
 */
function detectStandardEnvironment(params) {
  // Check action parameters first
  if (params.NODE_ENV) {
    return params.NODE_ENV;
  }

  // Check environment variables
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // Check OpenWhisk namespace
  if (process.env.__OW_NAMESPACE?.includes('stage')) {
    return 'staging';
  }

  return null;
}

/**
 * Detect the current environment (staging or production)
 * @param {Object} [params] - Action parameters from Adobe I/O Runtime
 * @param {Object} [options] - Detection options
 * @param {boolean} [options.allowCliDetection=false] - Allow Adobe CLI workspace detection for local testing
 * @returns {string} Environment name ('staging' or 'production')
 * @description Uses the following detection order:
 * 1. Check params.NODE_ENV (action parameter)
 * 2. Check process.env.NODE_ENV (environment variable)
 * 3. Check if __OW_NAMESPACE contains 'stage' (runtime namespace detection)
 * 4. If allowCliDetection=true, try Adobe CLI workspace detection
 * 5. Default to 'production'
 */
function detectEnvironment(params = {}, options = {}) {
  // Import CLI detection here to avoid circular dependencies
  const { detectCliEnvironment } = require('./cli');

  // Try standard detection first
  const standardResult = detectStandardEnvironment(params);
  if (standardResult) {
    return standardResult;
  }

  // Try CLI detection if enabled
  if (options.allowCliDetection) {
    const cliResult = detectCliEnvironment();
    if (cliResult) {
      return cliResult;
    }
  }

  // Default to production
  return 'production';
}

module.exports = {
  detectStandardEnvironment,
  detectEnvironment,
};
