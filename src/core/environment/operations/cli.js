/**
 * CLI environment detection operations
 * @module core/environment/operations/cli
 */

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
 * Attempts to detect environment using Adobe CLI workspace information
 * @param {Object} [config] - Configuration object (optional dependency injection)
 * @returns {string|null} Environment name or null if not detected
 */
function detectCliEnvironment(config = null) {
  try {
    const { execSync } = require('child_process');

    // Use config timeout if available, otherwise use sensible default
    const timeout = config?.runtime?.environment?.cli?.timeout || 5000;

    const aioInfo = execSync('aio app info --json', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout,
    });
    const info = JSON.parse(aioInfo);

    return parseCliWorkspaceInfo(info);
  } catch (error) {
    return null;
  }
}

module.exports = {
  parseCliWorkspaceInfo,
  detectCliEnvironment,
};
