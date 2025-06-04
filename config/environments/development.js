/**
 * Development environment configuration
 * @module config/environments/development
 */

// Load environment variables
require('dotenv').config();

// Determine if this is for deployed development or local development
const isDeployed = process.env.DEV_DEPLOYED === 'true';

const localConfig = {
  baseUrl: 'https://localhost:9080',
  namespace: 'local',
};

const deployedConfig = {
  baseUrl: 'https://adobeioruntime.net/api/v1/web/285361-188maroonwallaby-dev',
  namespace: '285361-188maroonwallaby-dev',
};

const runtimeConfig = isDeployed ? deployedConfig : localConfig;

module.exports = {
  app: {
    name: 'kukla-integration-service',
    version: '0.0.1',
    environment: 'development',
    runtime: {
      environment: 'development',
      deployed: isDeployed,
    },
    performance: {
      enabled: true,
      thresholds: {
        api: {
          warning: 500, // Lower threshold for development
          critical: 2000,
        },
        rendering: {
          warning: 200,
          critical: 800,
        },
      },
    },
    monitoring: {
      tracing: {
        enabled: false, // Enable detailed tracing in development
        logLevel: 'debug',
        stepLogging: true, // Log each step execution
        errorVerbosity: 'full', // Include full stack traces
        performance: {
          enabled: false,
          includeMemory: true, // Track memory usage in traces
          includeTimings: true, // Track detailed timings
        },
      },
    },
  },
  url: {
    runtime: {
      baseUrl: runtimeConfig.baseUrl,
      namespace: runtimeConfig.namespace,
      package: 'kukla-integration-service',
      version: 'v1',
      paths: {
        web: '/web',
        base: '/api',
      },
    },
    commerce: {
      baseUrl: 'https://citisignal-com774.adobedemo.com',
      version: 'V1',
      paths: {
        adminToken: '/integration/admin/token',
        products: '/products',
        stockItem: '/inventory/source-items',
        category: '/categories/:id',
        categoryList: '/categories',
      },
    },
  },
  commerce: {
    api: {
      timeout: 30000,
      retry: {
        attempts: 3,
        delay: 1000,
      },
      batch: {
        size: 50,
        inventory: 30, // Larger batch size for development
        delay: 50, // Shorter delay for faster development testing
      },
      cache: {
        duration: 60, // Shorter cache duration for development
      },
      concurrency: {
        maxRequests: 20, // Higher concurrency for development
      },
    },
    product: {
      fields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      required: ['sku', 'name'],
      validation: {
        sku: {
          pattern: '^[A-Za-z0-9_-]+$',
          minLength: 1,
          maxLength: 64,
          message: 'SKU must be alphanumeric with dashes or underscores, 1-64 characters',
        },
        name: {
          minLength: 1,
          maxLength: 255,
          message: 'Product name must be 1-255 characters',
        },
        price: {
          min: 0,
          message: 'Price must be non-negative',
        },
      },
      pagination: {
        pageSize: 20, // Smaller page size for easier debugging
        maxPages: 10, // Fewer pages in development for faster testing
      },
    },
  },
  security: {
    authentication: {
      commerce: {
        type: 'token',
        tokenRefresh: {
          enabled: true,
          interval: 3600, // 1 hour refresh interval
        },
      },
    },
  },
  storage: {
    provider: 'app-builder', // Options: 'app-builder' or 's3'
    csv: {
      chunkSize: 100,
      compressionLevel: 6,
      streamBufferSize: 16384,
      filename: 'products.csv',
    },
    s3: {
      region: 'us-east-1',
      bucket: 'your-s3-bucket-name', // Configure this for S3 usage
      prefix: 'files/', // Optional: prefix for all files
      // accessKeyId and secretAccessKey can be set via environment variables:
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    },
  },
  testing: {
    api: {
      local: {
        baseUrl: 'http://localhost',
        port: 9080,
      },
      defaults: {
        endpoint: '/products',
        method: 'GET',
      },
      timeout: 30000,
      retry: {
        attempts: 3,
        delay: 1000,
      },
      logLevel: 'debug', // More verbose logging in development
    },
    performance: {
      scenarios: {
        productExport: {
          name: 'Product Export',
          description: 'Test product export performance',
          steps: [
            {
              name: 'Fetch Products',
              type: 'api',
              config: {
                endpoint: '/products',
                method: 'GET',
              },
              weight: 60,
              think: 1000,
            },
            {
              name: 'Process Data',
              type: 'data',
              config: {
                transform: true,
                validate: true,
              },
              weight: 30,
              think: 500,
            },
            {
              name: 'Store Results',
              type: 'storage',
              config: {
                format: 'csv',
                compress: true,
              },
              weight: 10,
              think: 200,
            },
          ],
          concurrency: 5, // Lower concurrency for development
          duration: 30, // Shorter duration for development
          rampUp: 5, // Quick ramp up for development
        },
      },
      thresholds: {
        executionTime: 10000, // Lower threshold for development
        memory: 256, // Lower memory threshold for development
        products: 50, // Lower product processing threshold
        categories: 25, // Lower category processing threshold
        compression: 0.3, // Lower compression ratio for development
        responseTime: {
          p95: 500, // Lower response time thresholds for development
          p99: 1000,
        },
        errorRate: 5, // Higher error rate tolerance in development
      },
      baseline: {
        maxAgeDays: 7, // Shorter baseline age for development
      },
    },
  },
  category: {
    batchSize: 20,
    requestRetries: 2,
    retryDelay: 1000, // milliseconds
    cacheTtl: 3600, // 1 hour in seconds
  },
};
