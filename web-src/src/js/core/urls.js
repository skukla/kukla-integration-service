/**
 * URL utilities for the application
 * @module core/urls
 */

import { showNotification } from './notifications.js';

// Base API path
const API_PREFIX = '/api/v1/web/kukla-integration-service';

// Action URL configuration
const ACTION_URLS = {
    'browse-files': `${API_PREFIX}/browse-files`,
    'download-file': `${API_PREFIX}/download-file`,
    'upload-file': `${API_PREFIX}/upload-file`,
    'delete-file': `${API_PREFIX}/delete-file`
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

    const url = new URL(baseUrl, window.location.origin);
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