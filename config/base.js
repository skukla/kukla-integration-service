/**
 * Base configuration with better mental model organization
 * @module config/base
 */

module.exports = {
  products: {
    fields: ['sku', 'name', 'price', 'qty', 'categories', 'images', 'custom_attributes'],
    batchSize: 50,
  },
  categories: {
    batchSize: 10,
    cacheTimeout: 1800,
    retries: 3,
    retryDelay: 1000,
  },
  commerce: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    paths: {
      adminToken: '/integration/admin/token',
      products: '/products',
      inventory: '/inventory/source-items',
      stockItem: '/inventory/source-items',
      categories: '/categories',
      category: '/categories/:id',
      categoryList: '/categories',
    },
    auth: {
      type: 'token',
      tokenRefresh: {
        enabled: true,
        interval: 3600,
      },
    },
    batching: {
      products: 50,
    },
    caching: {},
  },
  storage: {
    provider: 's3', // 's3' or 'app-builder'
    csv: {
      filename: 'products.csv',
    },
    s3: {
      region: 'us-east-1',
      bucket: 'demo-commerce-integrations',
      prefix: 'public/',
    },
  },
  performance: {
    tracing: {
      enabled: true,

      trackTimings: true,
    },
  },
  runtime: {
    package: 'kukla-integration-service',
    version: 'v1',
    paths: {
      base: '/api',
      web: '/web',
      api: '/api',
    },
    actions: {
      'get-products': 'get-products',
      'browse-files': 'browse-files',
      'download-file': 'download-file',
      'delete-file': 'delete-file',
      'get-products-mesh': 'get-products-mesh',
    },
  },
  mesh: {
    timeout: 30000,
    retries: 3,
    pagination: {
      defaultPageSize: 100,
      maxPages: 50,
    },
    batching: {
      categories: 10,
      inventory: 20,
      maxConcurrent: 5,
      requestDelay: 200,
    },
  },
  testing: {
    timeout: 30000,
    retries: 3,
    scenarios: {
      productExport: {},
    },
    performance: {
      scenarios: {
        'rest-api-small': {
          name: 'REST API - Small Dataset',
          action: 'get-products',
          description: 'Test REST API with 50 products',
          params: {
            limit: 50,
          },
        },
        'rest-api-medium': {
          name: 'REST API - Medium Dataset',
          action: 'get-products',
          description: 'Test REST API with 100 products',
          params: {
            limit: 100,
          },
        },
        'mesh-small': {
          name: 'API Mesh - Small Dataset',
          action: 'get-products-mesh',
          description: 'Test API Mesh with 50 products',
          params: {
            limit: 50,
          },
        },
        'mesh-medium': {
          name: 'API Mesh - Medium Dataset',
          action: 'get-products-mesh',
          description: 'Test API Mesh with 100 products',
          params: {
            limit: 100,
          },
        },
        'comparison-standard': {
          name: 'REST vs Mesh - Standard Load',
          actions: ['get-products', 'get-products-mesh'],
          description: 'Compare REST API vs API Mesh performance',
          params: {
            limit: 100,
          },
        },
      },
      thresholds: {
        executionTime: 15000, // 15 seconds max
        memory: 256, // 256MB max
        responseTime: {
          p95: 10000, // 10 seconds
          p99: 15000, // 15 seconds
        },
        errorRate: 0.02, // 2% max error rate
        products: 1000, // max products to test
        categories: 200, // max categories
        compression: 30, // min compression ratio %
      },
      baseline: {
        maxAgeDays: 30,
        file: 'config/baseline-metrics.json',
        autoUpdate: true,
      },
    },
  },
};
