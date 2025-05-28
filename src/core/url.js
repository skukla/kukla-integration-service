/**
 * URL builder utility
 * @module core/url
 */

const { loadConfig } = require('../../config');

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
 * Builds a frontend URL for the given route
 * @param {string} route - The route name
 * @param {Object} [params] - Route parameters
 * @returns {string} The complete frontend URL
 */
function buildFrontendUrl(route, params = {}) {
  const config = loadConfig();
  const { frontend } = config.url;
  const routePath = frontend.routes[route];
  
  if (!routePath) {
    throw new Error(`Unknown route: ${route}`);
  }
  
  // Replace route parameters
  let url = routePath;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return `${frontend.baseUrl}${url}`;
}

/**
 * Builds a commerce API URL for the given endpoint
 * @param {string} endpoint - The endpoint name
 * @param {Object} [params] - Route parameters
 * @returns {string} The complete commerce API URL
 */
function buildCommerceUrl(endpoint, params = {}) {
  const config = loadConfig();
  const { commerce } = config;
  const path = commerce.paths[endpoint];
  
  if (!path) {
    throw new Error(`Unknown commerce endpoint: ${endpoint}`);
  }
  
  // Replace route parameters
  let url = path;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return `${commerce.baseUrl}/rest/${commerce.version}${url}`;
}

module.exports = {
  buildRuntimeUrl,
  buildFrontendUrl,
  buildCommerceUrl
}; 