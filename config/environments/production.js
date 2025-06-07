/**
 * Production environment overrides - organized by mental model
 * @module config/environments/production
 */

const merge = require('lodash.merge');

const baseConfig = require('../base');

const productionOverrides = {
  environment: 'production',
  products: {
    perPage: 100,
    maxTotal: 5000,
  },
  commerce: {
    baseUrl: 'https://citisignal-com774.adobedemo.com',
    batching: {
      inventory: 20,
      maxConcurrent: 10,
      requestDelay: 100,
    },
    caching: {
      duration: 3600, // 1 hour
    },
  },
  storage: {
    csv: {
      chunkSize: 500,
      compression: 9,
      bufferSize: 65536,
    },
  },
  performance: {
    maxExecutionTime: 30000,
    maxMemoryUsage: 512,
    maxErrorRate: 1,
    tracing: {
      logLevel: 'warn',
      stepLogging: false,
      errorVerbosity: 'minimal',
      trackMemory: false,
    },
  },
  runtime: {
    baseUrl: 'https://adobeioruntime.net',
    namespace: '285361-188maroonwallaby',
  },

  // === TESTING ===
  testing: {
    logLevel: 'warn',
    scenarios: {
      productExport: {
        concurrency: 15,
        duration: 120,
        rampUp: 15,
      },
    },
  },
};

module.exports = merge({}, baseConfig, productionOverrides);
