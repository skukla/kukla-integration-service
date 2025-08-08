/**
 * Utility Functions
 * URL utilities, general helpers, and common functions
 *
 * Note: Many exports are not currently used but are provided for future use
 * and external integrations. This is a utility module by design.
 */

/* eslint-disable */

import { config } from '../config/generated/config.js';

// ============================================================================
// URL UTILITIES
// ============================================================================

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

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format execution time for display
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatExecutionTime(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  };

  element.scrollIntoView({ ...defaultOptions, ...options });
}

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Get current URL configuration for debugging
 * @returns {Object} URL configuration
 */
export function getUrlConfig() {
  return {
    runtimeUrl: config.runtime?.url,
    package: config.runtime?.package,
    environment: config.environment,
  };
}

/**
 * Get performance configuration
 * @returns {Object} Performance settings
 */
export function getPerformanceConfig() {
  return {
    timeout: config.performance?.timeout || 30000,
    retries: config.performance?.retries || 3,
    expectedCount: config.products?.expectedCount || 100,
  };
}

/**
 * Get UI configuration
 * @returns {Object} UI settings
 */
export function getUiConfig() {
  return {
    notifications: config.ui?.notifications || {},
    modal: config.ui?.modal || {},
    loading: config.ui?.loading || {},
  };
}
