/**
 * Storage configuration module
 * @module core/config/storage
 */

/**
 * Default storage configuration
 * @constant {Object}
 */
const STORAGE_CONFIG = {
    // API configuration
    API: {
        VERSION: 'v1',
        BASE_PATH: '/api',
        WEB_PATH: '/web'
    },
    
    // File storage configuration
    FILES: {
        PUBLIC_DIR: 'public',
        TEMP_DIR: 'temp',
        MAX_FILE_SIZE: 100 * 1024 * 1024 // 100MB
    },
    
    // CSV configuration
    CSV: {
        CHUNK_SIZE: 100,
        COMPRESSION_LEVEL: 6,
        STREAM_BUFFER_SIZE: 16384
    }
};

/**
 * Builds an API URL for file operations
 * @param {Object} options - URL building options
 * @param {string} options.org - Organization name
 * @param {string} options.service - Service name
 * @param {string} options.action - Action name
 * @param {Object} [options.params] - Query parameters
 * @returns {string} Complete API URL
 */
function buildApiUrl({ org, service, action, params = {} }) {
    const basePath = [
        STORAGE_CONFIG.API.BASE_PATH,
        STORAGE_CONFIG.API.VERSION,
        STORAGE_CONFIG.API.WEB_PATH,
        org,
        service,
        action
    ].join('/');

    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Gets the complete storage configuration
 * @param {Object} [overrides] - Configuration overrides
 * @returns {Object} Complete storage configuration
 */
function getStorageConfig(overrides = {}) {
    return {
        ...STORAGE_CONFIG,
        ...overrides
    };
}

module.exports = {
    STORAGE_CONFIG,
    buildApiUrl,
    getStorageConfig
}; 