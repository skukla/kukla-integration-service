/**
 * URL Utilities
 * @module core/urls
 */

// URL configuration
const URL_CONFIG = {
    BASE_PATH: '/api',
    ACTIONS: {
        'browse-files': '/files/browse',
        'delete-file': '/files/delete',
        'upload-file': '/files/upload',
        'download-file': '/files/download',
        'file-info': '/files/info'
    }
};

/**
 * Build a URL for an action with optional parameters
 * @param {string} action - The action identifier
 * @param {Object} [params] - URL parameters
 * @returns {string} The complete URL
 */
export function getActionUrl(action, params = {}) {
    const path = URL_CONFIG.ACTIONS[action];
    if (!path) {
        console.warn(`Unknown action: ${action}`);
        return '';
    }

    const url = new URL(URL_CONFIG.BASE_PATH + path, window.location.origin);
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    return url.toString();
}

/**
 * Get the download URL for a file
 * @param {string} fileName - The name of the file
 * @param {string} [path] - Optional path to the file
 * @returns {string} The download URL
 */
export function getDownloadUrl(fileName, path) {
    return getActionUrl('download-file', {
        fileName,
        path
    });
}

/**
 * Get the file info URL
 * @param {string} fileName - The name of the file
 * @param {string} [path] - Optional path to the file
 * @returns {string} The file info URL
 */
export function getFileInfoUrl(fileName, path) {
    return getActionUrl('file-info', {
        fileName,
        path
    });
}

/**
 * Get the upload URL for a file
 * @param {string} [path] - Optional target path
 * @returns {string} The upload URL
 */
export function getUploadUrl(path) {
    return getActionUrl('upload-file', { path });
}

/**
 * Get the delete URL for a file
 * @param {string} fileName - The name of the file
 * @param {string} [path] - Optional path to the file
 * @returns {string} The delete URL
 */
export function getDeleteUrl(fileName, path) {
    return getActionUrl('delete-file', {
        fileName,
        path
    });
} 