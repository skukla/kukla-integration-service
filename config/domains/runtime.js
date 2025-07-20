/**
 * Runtime Domain Configuration
 * @module config/domains/runtime
 *
 * Used by: All Adobe I/O Runtime actions
 * ⚙️ Key settings: Action URLs, package names, routing, logging configuration
 *
 * 📋 Environment settings: Requires RUNTIME_URL from environment
 */

const { getRuntimeParameters } = require('../../src/shared/utils/parameters');

/**
 * Default runtime configuration object
 * @returns {Object} Default runtime configuration
 */
function getDefaultRuntimeConfig() {
  return {
    package: 'kukla-integration-service',
    version: 'v1',
    paths: {
      base: '/api',
      web: '/web',
    },
    actions: {
      'get-products': 'get-products',
      'browse-files': 'browse-files',
      'download-file': 'download-file',
      'delete-file': 'delete-file',
      'get-products-mesh': 'get-products-mesh',
    },
    logging: {
      defaultLevel: 'info',
      validLevels: ['debug', 'info', 'warn', 'error', 'trace'],
      debugLevels: ['debug', 'trace'],
      actionLoggerName: 'action',
    },
    domains: {
      expected: '.adobeio-static.net',
      legacy: '.adobeioruntime.net',
    },
    environment: {
      cli: {
        allowCliDetection: true,
      },
    },
  };
}

/**
 * Build runtime configuration
 * @param {Object} [params] - Action parameters for environment values
 * @returns {Object} Runtime configuration
 */
function buildRuntimeConfig(params = {}) {
  const { url, namespace } = getRuntimeParameters(params, {});

  return {
    url,
    namespace,
    ...getDefaultRuntimeConfig(),
  };
}

/**
 * Build testing runtime configuration for scripts
 * @returns {Object} Runtime configuration for testing
 */
function buildTestingRuntimeConfig() {
  // Use smart parameter resolution for runtime connection
  const { url, namespace } = getRuntimeParameters({}, {});

  return {
    url,
    namespace,
    package: 'kukla-integration-service',
    version: 'v1',
    paths: {
      base: '/api',
      web: '/web',
    },
    domains: {
      expected: '.adobeio-static.net',
      legacy: '.adobeioruntime.net',
    },
  };
}

module.exports = {
  buildRuntimeConfig,
  buildTestingRuntimeConfig,
};
