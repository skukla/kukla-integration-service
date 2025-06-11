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
  },
  testing: {
    timeout: 30000,
    retries: 3,
    scenarios: {
      productExport: {},
    },
  },
};
