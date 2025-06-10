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
      errorVerbosity: 'summary',
      trackMemory: false,
    },
  },
  runtime: {
    baseUrl: 'https://adobeioruntime.net',
    namespace: '285361-188maroonwallaby',
  },
  mesh: {
    endpoint:
      'https://edge-sandbox-graph.adobe.io/api/e4865722-2b0a-4f3f-bc87-f3302b64487b/graphql',
    apiKey: process.env.MESH_API_KEY,
    timeout: 30000,
    retries: 3,
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
