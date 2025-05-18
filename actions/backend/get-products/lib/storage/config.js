/**
 * Storage configuration utilities
 * @module storage/config
 */

const { Files: FilesLib } = require('@adobe/aio-sdk');

/**
 * Gets the configured storage client
 * @returns {Promise<Object>} Storage configuration object
 * @property {string} location - Storage location ('filestore')
 * @property {Object} files - Files SDK client
 */
async function getStorageConfig() {
    const files = await FilesLib.init();
    return {
        location: 'filestore',
        files
    };
}

module.exports = {
    getStorageConfig
}; 