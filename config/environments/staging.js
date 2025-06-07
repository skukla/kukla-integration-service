/**
 * Staging environment configuration
 * @module config/environments/staging
 */

module.exports = {
  app: {
    name: 'kukla-integration-service',
    version: '0.0.1',
    environment: 'staging',
    runtime: {
      environment: 'staging',
    },
    performance: {
      enabled: true,
      thresholds: {
        api: {
          warning: 800, // Moderate threshold for staging
          critical: 2500,
        },
        rendering: {
          warning: 250,
          critical: 900,
        },
      },
    },
    monitoring: {
      tracing: {
        enabled: true, // Enable tracing in staging
        logLevel: 'info',
        stepLogging: true, // Log each step execution
        errorVerbosity: 'summary', // Include error summaries
        performance: {
          enabled: true,
          includeMemory: true, // Track memory usage in traces
          includeTimings: true, // Track detailed timings
        },
      },
    },
  },
  url: {
    runtime: {
      baseUrl: 'https://285361-188maroonwallaby-stage.adobeio-static.net',
      namespace: '',
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
        inventory: 25, // Intermediate batch size for staging
        delay: 75, // Intermediate delay for staging
      },
      cache: {
        duration: 1800, // 30 minutes cache in staging
      },
      concurrency: {
        maxRequests: 15, // Moderate concurrency for staging
      },
    },
    product: {
      fields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      pagination: {
        pageSize: 50, // Moderate page size for staging
        maxPages: 20, // Moderate number of pages for staging
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
    provider: 's3',
    csv: {
      chunkSize: 200,
      compressionLevel: 6,
      streamBufferSize: 32768,
      filename: 'products.csv',
    },
    s3: {
      region: 'us-east-1',
      bucket: 'demo-commerce-integrations',
      prefix: 'public/',
    },
  },
  testing: {
    api: {
      local: {
        baseUrl: 'https://285361-188maroonwallaby-stage.adobeioruntime.net',
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
      logLevel: 'info', // Standard logging in staging
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
              think: 1500,
            },
            {
              name: 'Process Data',
              type: 'data',
              config: {
                transform: true,
                validate: true,
              },
              weight: 30,
              think: 750,
            },
            {
              name: 'Store Results',
              type: 'storage',
              config: {
                format: 'csv',
                compress: true,
              },
              weight: 10,
              think: 500,
            },
          ],
          concurrency: 10, // Moderate concurrency for staging
          duration: 60, // Standard duration for staging
          rampUp: 10, // Moderate ramp up for staging
        },
      },
      thresholds: {
        executionTime: 20000, // Moderate threshold for staging
        memory: 384, // Moderate memory threshold for staging
        products: 75, // Moderate product processing threshold
        categories: 35, // Moderate category processing threshold
        compression: 0.4, // Moderate compression ratio for staging
        responseTime: {
          p95: 750, // Moderate response time thresholds for staging
          p99: 1500,
        },
        errorRate: 2, // Moderate error rate tolerance in staging
      },
      baseline: {
        maxAgeDays: 14, // Two weeks baseline age for staging
      },
    },
  },
};
