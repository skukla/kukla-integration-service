/**
 * Runtime URL operations
 * @module core/routing/operations/runtime
 */

/**
 * Core URL builder - works in both Node.js and browser environments
 * @param {Object} config - Runtime configuration
 * @param {string} action - Action name
 * @param {Object} [options] - URL building options
 * @returns {string} Built URL
 */
function buildActionUrl(config, action, options = {}) {
  const { url, package: pkg, version, paths } = config.runtime || config;
  const { params = {}, absolute = true } = options;

  // Handle different URL patterns based on environment
  let actionPath;

  if (!absolute || !url) {
    // Relative URL for HTMX/static hosting
    actionPath = `${paths.base}/${version}${paths.web}/${pkg}/${action}`;
  } else {
    // Absolute URL using environment-specific runtime URL
    actionPath = `${url}${paths.base}/${version}${paths.web}/${pkg}/${action}`;
  }

  // Add URL parameters if provided
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      actionPath += `?${queryString}`;
    }
  }

  return actionPath;
}

/**
 * Build a runtime action URL for backend use
 * @param {string} action - Action name
 * @param {string} [customBaseUrl] - Optional custom base URL (for testing)
 * @param {Object} config - Configuration object (now required parameter)
 * @returns {string} Complete runtime URL
 */
function buildRuntimeUrl(action, customBaseUrl = null, config) {
  if (!config) {
    throw new Error('Configuration is required for buildRuntimeUrl');
  }

  const options = {
    absolute: true,
    params: {},
  };

  // Handle custom base URL for testing
  if (customBaseUrl) {
    const modifiedConfig = {
      ...config,
      runtime: {
        ...config.runtime,
        url: customBaseUrl,
      },
    };
    return buildActionUrl(modifiedConfig, action, options);
  }

  return buildActionUrl(config, action, options);
}

module.exports = {
  buildActionUrl,
  buildRuntimeUrl,
};
