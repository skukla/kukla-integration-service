/**
 * Development environment configuration
 * @module config/environments/development
 */

module.exports = {
  app: {
    name: 'kukla-integration-service',
    version: '0.0.1',
    environment: 'development',
    runtime: {
      environment: 'development',
    },
  },
  url: {
    runtime: {
      baseUrl: 'https://localhost:9080',
      namespace: 'local',
      package: 'kukla-integration-service',
      version: 'v1',
      paths: {
        web: '/web',
        base: '/api',
      },
    },
    commerce: {
      baseUrl: 'https://citisignal-com774-dev.adobedemo.com',
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
      },
      cache: {
        duration: 300,
      },
    },
  },
  security: {
    authentication: {
      commerce: {
        type: 'basic',
        tokenRefresh: {
          enabled: true,
          interval: 3600,
        },
      },
    },
  },
  testing: {
    api: {
      baseUrl: 'https://localhost:9080',
      timeout: 30000, // 30 seconds
      retries: 3,
      delay: 1000,
      logLevel: 'info',
    },
    performance: {
      concurrency: 10,
      duration: 60,
      rampUp: 10,
      thresholds: {
        responseTime: {
          p95: 1000,
          p99: 2000,
        },
        errorRate: 1,
      },
      scenarios: [
        {
          name: 'get-products',
          weight: 60,
          think: 1000,
        },
        {
          name: 'browse-files',
          weight: 30,
          think: 500,
        },
        {
          name: 'download-file',
          weight: 10,
          think: 2000,
        },
      ],
    },
  },
};
