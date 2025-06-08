/**
 * Frontend URL management
 * @module core/url
 */

import { getRuntimeConfig } from './config.js';

/**
 * Core URL builder for frontend use - matches backend implementation
 * @param {Object} config - Runtime configuration
 * @param {string} action - Action name
 * @param {Object} [options] - URL building options
 * @returns {string} Built URL
 */
function buildActionUrl(config, action, options = {}) {
  const { baseUrl, namespace, package: pkg, version, paths } = config;
  const { params = {}, absolute = true, includeNamespace = null } = options;

  // Auto-detect namespace inclusion based on baseUrl pattern
  let shouldIncludeNamespace = includeNamespace;
  if (shouldIncludeNamespace === null) {
    // Include namespace in path only for direct runtime domains
    shouldIncludeNamespace = baseUrl && baseUrl.includes('adobeioruntime.net');
  }

  // Handle different URL patterns based on environment
  let actionPath;

  if (!absolute || !baseUrl) {
    // Relative URL for HTMX/static hosting
    const namespacePath = shouldIncludeNamespace ? `/${namespace}` : '';
    actionPath = `${paths.base}/${version}${paths.web}${namespacePath}/${pkg}/${action}`;
  } else {
    // Absolute URL for backend/API calls
    const namespacePath = shouldIncludeNamespace ? `/${namespace}` : '';
    actionPath = `${baseUrl}${paths.base}/${version}${paths.web}${namespacePath}/${pkg}/${action}`;
  }

  // Add URL parameters if provided
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      actionPath += `?${queryString}`;
    }
  }

  return actionPath;
}

/**
 * Get the URL for an action with parameters
 * @param {string} action - The action name
 * @param {Object} [params] - URL parameters
 * @returns {string} The action URL
 * @throws {Error} If the action is unknown
 */
export function getActionUrl(action, params = {}) {
  const runtimeConfig = getRuntimeConfig();

  // Check if action exists in configuration
  if (!runtimeConfig.actions || !runtimeConfig.actions[action]) {
    throw new Error(`Unknown action: ${action}`);
  }

  // Determine if we should use relative URLs
  const useRelative = !runtimeConfig.baseUrl || runtimeConfig.baseUrl === '';

  return buildActionUrl(runtimeConfig, action, {
    absolute: !useRelative,
    params,
  });
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
    path,
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
    path,
  });
}

/**
 * Build download URL for files with proper encoding
 * @param {string} filePath - File path to download
 * @returns {string} Download URL
 */
export function buildDownloadUrl(filePath) {
  return getActionUrl('download-file', {
    filePath: encodeURIComponent(filePath),
  });
}

/**
 * Get configuration for debugging
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return getRuntimeConfig();
}
