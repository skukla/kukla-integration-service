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
    baseUrl: process.env.COMMERCE_BASE_URL,
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
      errorVerbosity: 'summary',
      trackMemory: false,
    },
  },
  runtime: {
    url: process.env.RUNTIME_URL_PRODUCTION,
  },
  mesh: {
    endpoint: process.env.API_MESH_ENDPOINT,
    apiKey: process.env.MESH_API_KEY,
    timeout: 30000,
    retries: 3,
    pagination: {
      defaultPageSize: 300, // Optimized based on performance testing
      maxPages: 25,
    },
    batching: {
      categories: 20, // Larger category batches for production
      inventory: 50, // Larger inventory batches for production
    },
  },
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
