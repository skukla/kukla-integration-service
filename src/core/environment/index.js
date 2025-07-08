/**
 * Environment detection utilities
 * @module core/environment
 * @description Shared utilities for detecting the current Adobe App Builder environment
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
 * Attempts to detect environment using Adobe CLI workspace information
 * @returns {string|null} Environment name or null if not detected
 */
function detectCliEnvironment() {
  try {
    const { execSync } = require('child_process');
    const aioInfo = execSync('aio app info --json', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 5000,
    });
    const info = JSON.parse(aioInfo);

    return parseCliWorkspaceInfo(info);
  } catch (error) {
    return null;
  }
}

/**
 * Parses Adobe CLI workspace information to determine environment
 * @param {Object} info - Parsed CLI info object
 * @returns {string|null} Environment name or null if not detected
 */
function parseCliWorkspaceInfo(info) {
  const workspace = info.all?.application?.project?.workspace?.name || '';
  const namespace = info.all?.application?.ow?.namespace || '';

  if (workspace.toLowerCase().includes('stage') || namespace.includes('stage')) {
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
