/**
 * Frontend Configuration System
 * Mirrors backend configuration patterns with frontend-safe data
 */

import generatedConfig from '../../../config/generated/config.js';

// Cache the loaded configuration
let cachedConfig = null;

/**
 * Load complete frontend configuration
 * Mirrors backend loadConfig() function
 * @returns {Object} Complete frontend configuration
 */
export function loadConfig() {
  if (!cachedConfig) {
    cachedConfig = generatedConfig;
  }
  return cachedConfig;
}

/**
 * Get complete configuration object
 * @returns {Object} Complete configuration
 */
export function getConfig() {
  return loadConfig();
}

/**
 * Get Runtime configuration
 * @returns {Object} Runtime settings and action mappings
 */
export function getRuntimeConfig() {
  const config = loadConfig();
  return config.runtime;
}

/**
 * Get Performance configuration
 * @returns {Object} Performance and timeout settings
 */
export function getPerformanceConfig() {
  const config = loadConfig();
  return config.performance;
}

/**
 * Get current environment
 * @returns {string} Environment name (staging, production)
 */
export function getEnvironment() {
  const config = loadConfig();
  return config.environment;
}

/**
 * Check if we're in staging environment
 * @returns {boolean} True if staging
 */
export function isStaging() {
  return getEnvironment() === 'staging';
}

/**
 * Check if we're in production environment
 * @returns {boolean} True if production
 */
export function isProduction() {
  return getEnvironment() === 'production';
}

/**
 * Get action mappings
 * @returns {Object} Available actions
 */
export function getActions() {
  const runtime = getRuntimeConfig();
  return runtime.actions;
}

/**
 * Get timeout configuration for HTMX
 * @returns {number} Timeout in milliseconds
 */
export function getTimeout() {
  const performance = getPerformanceConfig();
  return performance.timeout;
}

// Legacy compatibility - keep existing functions
export function getRuntimeUrl() {
  console.warn('getRuntimeUrl() is deprecated, use URL module functions instead');
  const runtime = getRuntimeConfig();

  if (!runtime.baseUrl) {
    return '/api/v1/web/kukla-integration-service/';
  }

  // Use the same modern pattern as the URL builder
  if (runtime.baseUrl.includes('adobeioruntime.net')) {
    const modernBaseUrl = runtime.baseUrl.replace(
      'adobeioruntime.net',
      `${runtime.namespace}.adobeioruntime.net`
    );
    return `${modernBaseUrl}/api/v1/web/${runtime.package}/`;
  } else {
    return `${runtime.baseUrl}/api/v1/web/${runtime.package}/`;
  }
}
