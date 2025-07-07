/**
 * Simple Configuration
 * @module config
 *
 * Clean, readable configuration with direct values.
 * Environment variables loaded once at the top.
 */

const dotenv = require('dotenv');

dotenv.config();

/**
 * Load configuration
 * @param {Object} [params] - Action parameters
 * @returns {Object} Configuration
 */
function loadConfig(params = {}) {
  // Load environment variables once
  const commerceBaseUrl = params.COMMERCE_BASE_URL || process.env.COMMERCE_BASE_URL;
  const storageProvider = params.STORAGE_PROVIDER || process.env.STORAGE_PROVIDER || 's3';
  const runtimeUrl = params.RUNTIME_URL || process.env.RUNTIME_URL;
  const meshEndpoint = params.API_MESH_ENDPOINT || process.env.API_MESH_ENDPOINT || null;
  const meshApiKey = params.MESH_API_KEY || process.env.MESH_API_KEY || null;

  return {
    // Commerce
    commerce: {
      baseUrl: commerceBaseUrl,
      timeout: 30000,
      paths: {
        products: '/products',
        stockItem: '/inventory/source-items',
        category: '/categories/:id',
        categoryList: '/categories',
      },
      caching: {
        duration: 1800, // 30 minutes
      },
    },

    // Storage
    storage: {
      provider: storageProvider,
      csv: {
        filename: 'products.csv',
      },
    },

    // Categories
    categories: {
      cacheTimeout: 1800, // 30 minutes
    },

    // Products
    products: {
      batchSize: 50,
    },

    // Runtime
    runtime: {
      url: runtimeUrl,
      package: 'kukla-integration-service',
      version: 'v1',
      paths: {
        base: '/api',
        web: '/web',
      },
      actions: {
        'get-products': 'get-products',
        'browse-files': 'browse-files',
        'download-file': 'download-file',
        'delete-file': 'delete-file',
        'get-products-mesh': 'get-products-mesh',
      },
    },

    // Performance (minimal)
    performance: {
      maxExecutionTime: 30000,
      tracing: {
        enabled: true,
        performance: {
          enabled: true,
          includeMemory: true,
          includeTimings: true,
        },
      },
    },

    // Mesh
    mesh: {
      endpoint: meshEndpoint,
      apiKey: meshApiKey,
      timeout: 30000,
      retries: 3,
      pagination: {
        defaultPageSize: 150,
        maxPages: 25,
      },
      batching: {
        categories: 20,
        inventory: 25,
        maxConcurrent: 15,
        requestDelay: 75,
      },
    },
  };
}

/**
 * Load configuration with basic validation
 */
function loadValidatedConfig(params = {}) {
  const config = loadConfig(params);

  // Just check that critical URLs exist
  if (!config.commerce.baseUrl) {
    console.warn('Missing commerce.baseUrl');
  }

  return config;
}

module.exports = {
  loadConfig,
  loadValidatedConfig,
};
