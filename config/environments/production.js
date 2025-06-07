/**
 * Production environment configuration
 * @module config/environments/production
 */

module.exports = {
  app: {
    name: 'kukla-integration-service',
    version: '0.0.1',
    environment: 'production',
    runtime: {
      environment: 'production',
    },
    performance: {
      enabled: true,
      thresholds: {
        api: {
          warning: 1000, // Strict threshold for production
          critical: 3000,
        },
        rendering: {
          warning: 300,
          critical: 1000,
        },
      },
    },
    monitoring: {
      tracing: {
        enabled: true, // Enable tracing in production
        logLevel: 'warn',
        stepLogging: false, // Minimize logging in production
        errorVerbosity: 'minimal', // Basic error information only
        performance: {
          enabled: true,
          includeMemory: false, // Minimize overhead in production
          includeTimings: true, // Keep timing information
        },
      },
    },
  },
  url: {
    runtime: {
      baseUrl: 'https://adobeioruntime.net',
      namespace: '285361-188maroonwallaby',
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
        inventory: 20, // Conservative batch size for production
        delay: 100, // Conservative delay for production
      },
      cache: {
        duration: 3600, // 1 hour cache in production
      },
      concurrency: {
        maxRequests: 10, // Conservative concurrency for production
      },
    },
    product: {
      fields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      pagination: {
        pageSize: 100, // Larger page size for production efficiency
        maxPages: 50, // Maximum pages for production
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
    provider: 's3', // Use S3 storage in production
    csv: {
      chunkSize: 500,
      compressionLevel: 9,
      streamBufferSize: 65536,
      filename: 'products.csv',
    },
    s3: {
      region: 'us-east-1',
      bucket: 'demo-commerce-integrations',
      prefix: 'kukla-integration/', // Same prefix for consistency
      // Note: accessKeyId and secretAccessKey should be set via environment variables
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    },
  },
  testing: {
    api: {
      local: {
        baseUrl: 'https://285361-188maroonwallaby.adobeioruntime.net',
        port: 443,
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
      logLevel: 'warn', // Minimal logging in production
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
              think: 2000,
            },
            {
              name: 'Process Data',
              type: 'data',
              config: {
                transform: true,
                validate: true,
              },
              weight: 30,
              think: 1000,
            },
            {
              name: 'Store Results',
              type: 'storage',
              config: {
                format: 'csv',
                compress: true,
              },
              weight: 10,
              think: 750,
            },
          ],
          concurrency: 15, // Production-level concurrency
          duration: 120, // Extended duration for production
          rampUp: 15, // Gradual ramp up for production
        },
      },
      thresholds: {
        executionTime: 30000, // Strict threshold for production
        memory: 512, // Higher memory threshold for production
        products: 100, // Maximum product processing threshold
        categories: 50, // Maximum category processing threshold
        compression: 0.5, // Maximum compression ratio for production
        responseTime: {
          p95: 1000, // Strict response time thresholds for production
          p99: 2000,
        },
        errorRate: 1, // Minimal error rate tolerance in production
      },
      baseline: {
        maxAgeDays: 30, // Full month baseline age for production
      },
    },
  },
};
