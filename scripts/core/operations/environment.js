/**
 * Scripts Core Environment Operations
 * Shared environment detection used by all script domains
 */

/**
 * Detect script environment for any script operation
 * @param {Object} params - Parameters object
 * @param {Object} options - Detection options
 * @returns {string} Environment name
 */
function detectScriptEnvironment(params = {}, options = {}) {
  const { allowCliDetection = false } = options;

  // Check explicit parameter first
  if (params.NODE_ENV) {
    return params.NODE_ENV;
  }

  // Check environment variable
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // CLI detection (if allowed)
  if (allowCliDetection) {
    try {
      const { execSync } = require('child_process');
      const output = execSync('aio runtime namespace list --json', {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      const namespaces = JSON.parse(output);

      // Handle array format (current CLI output)
      if (Array.isArray(namespaces) && namespaces.length > 0) {
        const namespace = namespaces[0];
        if (namespace.includes('stage')) {
          return 'staging';
        }
      }

      // Handle object format (legacy support)
      const currentNamespace = namespaces.find && namespaces.find((ns) => ns.current);
      if (currentNamespace && currentNamespace.name.includes('stage')) {
        return 'staging';
      }
    } catch (error) {
      // CLI detection failed, fall back to default
    }
  }

  return 'production';
}

module.exports = {
  detectScriptEnvironment,
};
