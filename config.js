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
    },

    // API Mesh Configuration
    mesh: {
      endpoint: params.API_MESH_ENDPOINT,
      apiKey: params.MESH_API_KEY,
      batching: {
        categoryDisplayLimit: 10,
        thresholds: {
          categories: 1,
          inventory: 1,
        },
      },
    },

    // Storage Configuration
    storage: {
      provider: 's3', // 'app-builder' or 's3'
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
      expectedCount: 119,
      maxCategoriesDisplay: 10,
      fields: {
        export: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      },
    },

    // File Configuration
    files: {
      extensions: {
        csv: '.csv',
      },
      defaultFilename: 'products.csv',
    },

    // Main Export Fields (used by buildProducts)
    main: {
      exportFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
    },
  };
}

module.exports = createConfig;
