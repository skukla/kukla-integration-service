/**
 * Staging environment overrides - organized by mental model
 * @module config/environments/staging
 */

const merge = require('lodash.merge');

const baseConfig = require('../base');

const stagingOverrides = {
  environment: 'staging',
  products: {
    perPage: 50,
    maxTotal: 1000,
  },
  commerce: {
    baseUrl: 'https://citisignal-com774.adobedemo.com',
    batching: {
      inventory: 25,
      maxConcurrent: 15,
      requestDelay: 75,
    },
    caching: {
      duration: 1800, // 30 minutes
    },
  },
  storage: {
    provider: 's3',
    csv: {
      chunkSize: 200,
      compression: 6,
      bufferSize: 32768,
    },
  },
  performance: {
    maxExecutionTime: 20000,
    maxMemoryUsage: 384,
    maxErrorRate: 2,
    tracing: {
      logLevel: 'info',
      stepLogging: true,
      errorVerbosity: 'summary',
      trackMemory: true,
    },
  },
  runtime: {
    url: process.env.RUNTIME_URL_STAGING,
  },
  mesh: {
    endpoint: process.env.API_MESH_ENDPOINT,
    apiKey: process.env.MESH_API_KEY,
    timeout: 30000,
    retries: 3,
  },
  testing: {
    logLevel: 'info',
    scenarios: {
      productExport: {
        concurrency: 10,
        duration: 60,
        rampUp: 10,
      },
    },
  },
};

module.exports = merge({}, baseConfig, stagingOverrides);
