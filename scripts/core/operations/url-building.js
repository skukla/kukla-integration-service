/**
 * Core Infrastructure - URL Building Operations
 * Shared URL building utilities for Adobe I/O Runtime
 */

const { loadConfig } = require('../../../config');

/**
 * Build Adobe I/O Runtime action URL
 * @param {string} actionName - Name of action
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Built action URL
 */
function buildActionUrl(actionName, params = {}, isProd = false) {
  const config = loadConfig(params, isProd);
  const { url, package: pkg, version, paths } = config.runtime;
  const actionPath = `${url}${paths.base}/${version}${paths.web}/${pkg}/${actionName}`;
  return actionPath;
}

/**
 * Build Adobe I/O static app URL using configuration
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Static app URL
 */
function buildStaticAppUrl(params = {}, isProd = false) {
  const config = loadConfig(params, isProd);
  const { url, namespace } = config.runtime;

  // Transform runtime URL to static URL using configuration
  const staticUrl = url.replace('adobeioruntime.net', 'adobeio-static.net').replace('/api', ''); // Remove API path for static apps

  return `${staticUrl}/${namespace}`;
}

/**
 * Build base runtime URL without action path
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Base runtime URL
 */
function buildBaseRuntimeUrl(params = {}, isProd = false) {
  const config = loadConfig(params, isProd);
  const { url, package: pkg, version, paths } = config.runtime;
  return `${url}${paths.base}/${version}${paths.web}/${pkg}`;
}

module.exports = {
  buildActionUrl,
  buildStaticAppUrl,
  buildBaseRuntimeUrl,
};
