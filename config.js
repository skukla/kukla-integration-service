/**
 * Simplified Adobe App Builder Configuration
 * Direct configuration without over-engineered domain abstractions
 */

/**
 * Configuration factory function for Adobe I/O Runtime
 * Takes action parameters since process.env is not available in runtime
 * @param {Object} params - Action parameters containing environment variables
 * @returns {Object} Configuration object
 */
// eslint-disable-next-line max-lines-per-function
function createConfig(params = {}) {
  return {
    // Commerce API Configuration
    commerce: {
      baseUrl: params.COMMERCE_BASE_URL,
      adminUsername: params.COMMERCE_ADMIN_USERNAME,
      adminPassword: params.COMMERCE_ADMIN_PASSWORD,
      api: {
        version: 'V1',
        paths: {
          products: '/products',
          categories: '/categories',
          stockItems: '/stockItems',
          adminToken: '/integration/admin/token',
        },
      },
      batching: {
        inventory: 50,
        categories: 20,
      },
      pagination: {
        pageSize: 50,
        defaultPage: 1,
      },
    },

    // API Mesh Configuration
    mesh: {
      endpoint: params.API_MESH_ENDPOINT,
      apiKey: params.MESH_API_KEY,
      categoryDisplayLimit: 10,
      categoryBatchThreshold: 1,
      inventoryBatchThreshold: 1,
      pagination: {
        pageSize: 50,
        defaultPage: 1,
      },
    },

    // Storage Configuration
    storage: {
      provider: 's3',
      directory: 'public/',
    },

    // S3 Configuration (when using S3 provider)
    s3: {
      region: 'us-east-1',
      bucketName: 'demo-commerce-integrations',
      prefix: 'kukla-integration/',
      accessKeyId: params.AWS_ACCESS_KEY_ID,
      secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
    },

    // Product Export Configuration
    products: {
      maxCategoriesDisplay: 10,
      defaultFilename: 'products.csv',
    },

    // Cache Configuration
    cache: {
      adminTokenTtl: 900, // 15 minutes
      apiResponseTtl: 1800, // 30 minutes
      killSwitchTtl: 86400 * 365, // 1 year
      httpCacheMaxAge: 1800, // 30 minutes for HTTP Cache-Control header
    },
  };
}

module.exports = createConfig;
