/**
 * Storage configuration utilities
 * @module storage/config
 */

const { Files: FilesLib } = require('@adobe/aio-sdk');

const { loadConfig } = require('../../../../../config');

/**
 * Gets the configured storage client based on main application configuration
 * @returns {Promise<Object>} Storage configuration object
 * @property {string} location - Storage location from config
 * @property {Object} files - Files SDK client
 * @property {Object} config - Storage configuration settings
 */
async function getStorageConfig() {
  // Load main configuration
  const config = loadConfig();
  const storageConfig = config.storage;

  // For now, we only support app-builder provider
  // This could be extended to support S3 in the future
  if (storageConfig.provider !== 'app-builder') {
    throw new Error(
      `Unsupported storage provider: ${storageConfig.provider}. Only 'app-builder' is currently supported.`
    );
  }

  const files = await FilesLib.init();

  return {
    location: storageConfig.provider,
    files,
    config: storageConfig,
  };
}

module.exports = {
  getStorageConfig,
};
