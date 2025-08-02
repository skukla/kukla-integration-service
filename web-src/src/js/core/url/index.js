/**
 * GENERATED FILE - DO NOT EDIT
 * Frontend URL module generated from backend configuration
 */

import { config } from '../../../config/generated/config.js';

/**
 * Frontend URL utilities with absolute action URLs
 */

/**
 * Get absolute action URL for Adobe I/O Runtime actions
 * @param {string} action - Action name
 * @param {Object} params - URL parameters
 * @returns {string} Absolute action URL
 */
export function getActionUrl(action, params = {}) {
  // Use pre-built action URLs from configuration
  if (!config.runtime?.actions) {
    console.warn('Runtime actions not configured, falling back to relative URLs');
    return '/api/' + action;
  }

  // Get the pre-built action URL
  let url = config.runtime.actions[action];
  if (!url) {
    console.warn(`Action '${action}' not found in configuration, falling back to constructed URL`);
    url = config.runtime?.url ? `${config.runtime.url}/${action}` : `/api/${action}`;
  }

  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    if (searchParams.toString()) {
      url += '?' + searchParams.toString();
    }
  }

  return url;
}

/**
 * Get download URL (can be relative since download-file action handles redirects)
 * @param {string} fileName - File name
 * @param {string} path - File path prefix
 * @returns {string} Download URL
 */
export function getDownloadUrl(fileName, path = '') {
  return getActionUrl('download-file', { file: path + fileName });
}

/**
 * Get delete URL for file deletion
 * @param {string} fileName - File name to delete
 * @returns {string} Delete URL
 */
export function getDeleteUrl(fileName) {
  return getActionUrl('delete-file', { fileName });
}

/**
 * Build download URL with encoded file path
 * @param {string} filePath - Full file path
 * @returns {string} Download URL
 */
export function buildDownloadUrl(filePath) {
  return getActionUrl('download-file', { file: filePath });
}

/**
 * Get current configuration for debugging
 * @returns {Object} URL configuration
 */
export function getConfig() {
  return {
    runtimeUrl: config.runtime?.url,
    package: config.runtime?.package,
    environment: config.environment,
  };
}
