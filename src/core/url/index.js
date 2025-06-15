/**
 * URL Management
 *
 * Provides consistent URL building across backend and frontend contexts
 * @module core/url
 */

const { loadConfig } = require('../../../config');

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
 * Build a Commerce API URL
 * @param {string} baseUrl - Commerce base URL
 * @param {string} path - API endpoint path
 * @param {Object} [pathParams] - Parameters to replace in path
 * @returns {string} Complete Commerce API URL
 */
function buildCommerceUrl(baseUrl, path, pathParams = {}) {
  if (!baseUrl) {
    throw new Error('Commerce base URL is required');
  }

  // Normalize URL components
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  // Build API path with REST prefix
  let apiPath = `/rest/all/V1/${normalizedPath}`;

  // Replace path parameters
  Object.entries(pathParams).forEach(([key, value]) => {
    apiPath = apiPath.replace(`:${key}`, encodeURIComponent(value));
  });

  return `${normalizedBaseUrl}${apiPath}`;
}

/**
 * Build a runtime action URL for backend use
 * @param {string} action - Action name
 * @param {string} [customBaseUrl] - Optional custom base URL (for testing)
 * @param {Object} [params] - Action parameters for configuration loading
 * @returns {string} Complete runtime URL
 */
function buildRuntimeUrl(action, customBaseUrl = null, params = {}) {
  const config = loadConfig(params);

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
  buildCommerceUrl,
  buildRuntimeUrl,
};
