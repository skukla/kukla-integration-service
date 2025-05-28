/**
 * URL builder utility
 * @module core/routing/url
 */

const { loadConfig } = require('../../../config');

/**
 * Builds a runtime URL for the given action
 * @param {string} action - The action name
 * @returns {string} The complete runtime URL
 */
function buildRuntimeUrl(action) {
  const config = loadConfig();
  const { runtime } = config.url;
  
  return `${runtime.baseUrl}/api/${runtime.version}/web/${runtime.namespace}/${runtime.package}/${action}`;
}

/**
 * Builds a commerce URL for the given path
 * @param {string} path - The path name from config.url.commerce.paths
 * @param {Object} [params] - Path parameters
 * @returns {string} The complete commerce URL
 */
function buildCommerceUrl(path, params = {}) {
  const config = loadConfig();
  const { commerce } = config.url;
  const pathTemplate = commerce.paths[path];
  
  if (!pathTemplate) {
    throw new Error(`Unknown commerce path: ${path}`);
  }
  
  // Replace path parameters
  let url = pathTemplate;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return `${commerce.baseUrl}${url}`;
}

module.exports = {
  buildRuntimeUrl,
  buildCommerceUrl
}; 