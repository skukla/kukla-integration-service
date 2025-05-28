/**
 * URL utilities for the frontend application
 * @module core/urls
 */

// Runtime configuration
const RUNTIME_CONFIG = {
    baseUrl: process.env.RUNTIME_BASE_URL || 'https://adobeioruntime.net',
    namespace: process.env.RUNTIME_NAMESPACE || '285361-188maroonwallaby',
    package: process.env.RUNTIME_PACKAGE || 'kukla-integration-service',
    version: process.env.RUNTIME_VERSION || 'v1'
};

/**
 * Build a runtime URL for an action
 * @param {string} action - The action name
 * @returns {string} The complete runtime URL
 */
function buildRuntimeUrl(action) {
    const { baseUrl, namespace, package: pkg, version } = RUNTIME_CONFIG;
    return `${baseUrl}/api/${version}/web/${namespace}/${pkg}/${action}`;
}

// Action URL configuration
const ACTION_URLS = {
    'browse-files': buildRuntimeUrl('browse-files'),
    'download-file': buildRuntimeUrl('download-file'),
    'upload-file': buildRuntimeUrl('upload-file'),
    'delete-file': buildRuntimeUrl('delete-file')
};

/**
 * Get the URL for an action
 * @param {string} action - The action name
 * @param {Object} [params] - URL parameters
 * @returns {string} The action URL
 * @throws {Error} If the action is unknown
 */
export function getActionUrl(action, params = {}) {
    const baseUrl = ACTION_URLS[action];
    if (!baseUrl) {
        throw new Error(`Unknown action: ${action}`);
    }

    const url = new URL(baseUrl, document.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
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