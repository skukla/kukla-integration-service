/**
 * Deploy Domain - URL Building Operations
 * Deploy-specific URL utilities combining shared infrastructure with domain logic
 */

const { loadConfig } = require('../../../config');
const {
  buildActionUrl: sharedBuildActionUrl,
  buildStaticAppUrl: sharedBuildStaticUrl,
} = require('../../core/operations/url-building');

/**
 * Build Adobe I/O Runtime action URL for deployment
 * @param {string} actionName - Name of action
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Built action URL
 */
function buildActionUrl(actionName, params = {}, isProd = false) {
  return sharedBuildActionUrl(actionName, params, isProd);
}

/**
 * Build download URL for deployment
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Download URL
 */
function buildDownloadUrl(isProd = false) {
  const config = loadConfig({}, isProd);
  const fileName = config.storage.csv.filename;
  const actionUrl = buildActionUrl('download-file', {}, isProd);
  return `${actionUrl}?fileName=${fileName}`;
}

/**
 * Build Adobe I/O static app URL for deployment
 * @param {boolean} isProd - Whether building for production
 * @returns {string} Static app URL
 */
function buildStaticAppUrl(isProd = false) {
  return sharedBuildStaticUrl({}, isProd);
}

module.exports = {
  buildActionUrl,
  buildDownloadUrl,
  buildStaticAppUrl,
};
