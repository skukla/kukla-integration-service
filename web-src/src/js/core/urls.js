/**
 * URL utilities for the frontend application
 * @module core/urls
 */

import { actionUrls } from '../config';

/**
 * Get the URL for an action
 * @param {string} action - The action name
 * @param {Object} [params] - URL parameters
 * @returns {string} The action URL
 * @throws {Error} If the action is unknown
 */
export function getActionUrl(action, params = {}) {
  const baseUrl = actionUrls[action];
  if (!baseUrl) {
    throw new Error(`Unknown action: ${action}`);
  }

  try {
    // Handle relative URLs (empty baseUrl or paths starting with / for proxy setup)
    if (!baseUrl || baseUrl === '' || baseUrl.startsWith('/')) {
      // For relative URLs, use the baseUrl as-is if it's a path, or construct it
      let actionPath;
      if (baseUrl.startsWith('/')) {
        actionPath = baseUrl; // Use the provided relative path
      } else {
        actionPath = `/api/v1/web/kukla-integration-service/${action}`; // Construct from scratch
      }

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      return searchParams.toString() ? `${actionPath}?${searchParams.toString()}` : actionPath;
    }

    // Handle absolute URLs (when baseUrl is provided)
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  } catch (error) {
    console.error('Failed to construct URL:', {
      action,
      baseUrl,
      params,
      error: error.message,
    });
    throw error;
  }
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
