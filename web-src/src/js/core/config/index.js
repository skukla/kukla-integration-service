/**
 * Frontend configuration module
 * @module core/config
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
 * Get Commerce configuration
 * @returns {Object} Commerce settings
 */
export function getCommerceConfig() {
  const config = loadConfig();
  return config.commerce;
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
 * @returns {Object} Performance settings
 */
export function getPerformanceConfig() {
  const config = loadConfig();
  return config.performance;
}

/**
 * Get Storage configuration
 * @returns {Object} Storage settings
 */
export function getStorageConfig() {
  const config = loadConfig();
  return config.storage;
}

/**
 * Get Tracing configuration
 * @returns {Object} Tracing settings
 */
export function getTracingConfig() {
  const config = loadConfig();
  return config.performance.tracing;
}

/**
 * Get Timeout configuration
 * @returns {number} Timeout in milliseconds
 */
export function getTimeout() {
  const config = loadConfig();
  return config.performance.timeout;
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
  const config = loadConfig();
  return config.environment === 'staging';
}

/**
 * Check if we're in production environment
 * @returns {boolean} True if production
 */
export function isProduction() {
  const config = loadConfig();
  return config.environment === 'production';
}

/**
 * Get action mappings
 * @returns {Object} Available actions
 */
export function getActions() {
  const runtime = getRuntimeConfig();
  return runtime.actions;
}
