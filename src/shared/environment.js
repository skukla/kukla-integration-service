/**
 * Environment detection utilities
 * @module core/environment
 * @description Shared utilities for detecting the current Adobe App Builder environment
 */

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
  // Standard detection (works in both local and runtime contexts)
  const standardDetection =
    params.NODE_ENV ||
    process.env.NODE_ENV ||
    (process.env.__OW_NAMESPACE?.includes('stage') ? 'staging' : null);

  if (standardDetection) {
    return standardDetection;
  }

  // CLI detection (only for local testing when explicitly enabled)
  if (options.allowCliDetection) {
    try {
      const { execSync } = require('child_process');
      const aioInfo = execSync('aio app info --json', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 5000,
      });
      const info = JSON.parse(aioInfo);

      // Check workspace or namespace for staging indicators
      const workspace = info.all?.application?.project?.workspace?.name || '';
      const namespace = info.all?.application?.ow?.namespace || '';

      if (workspace.toLowerCase().includes('stage') || namespace.includes('stage')) {
        return 'staging';
      }
    } catch (error) {
      // CLI detection failed, fall through to default
    }
  }

  // Default to production
  return 'production';
}

/**
 * Check if current environment is staging
 * @param {Object} [params] - Action parameters
 * @returns {boolean} True if staging environment
 */
function isStaging(params = {}) {
  return detectEnvironment(params) === 'staging';
}

/**
 * Check if current environment is production
 * @param {Object} [params] - Action parameters
 * @returns {boolean} True if production environment
 */
function isProduction(params = {}) {
  return detectEnvironment(params) === 'production';
}

module.exports = {
  detectEnvironment,
  isStaging,
  isProduction,
};
