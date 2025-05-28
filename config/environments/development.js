/**
 * Development environment configuration
 * @module config/environments/development
 */

module.exports = {
  app: {
    runtime: {
      environment: 'development'
    }
  },
  url: {
    runtime: {
      baseUrl: 'https://localhost:9080',
      namespace: 'local',
      package: 'kukla-integration-service',
      version: 'v1',
      paths: {
        web: '/web',
        base: '/api'
      }
    },
    commerce: {
      baseUrl: 'https://citisignal-com774-dev.adobedemo.com',
      version: 'V1',
      paths: {
        adminToken: '/integration/admin/token',
        products: '/products',
        stockItem: '/inventory/source-items',
        category: '/categories/:id',
        categoryList: '/categories'
      }
    }
  },
  commerce: {
    api: {
      timeout: 60000, // Longer timeout for debugging
      retry: {
        attempts: 1, // Fewer retries in development
        delay: 1000
      },
      batch: {
        size: 10 // Smaller batch size for easier debugging
      },
      cache: {
        duration: 0 // Disable caching in development
      }
    }
  },
  security: {
    authentication: {
      commerce: {
        type: 'basic',
        tokenRefresh: {
          enabled: false // Disable token refresh in development
        }
      }
    }
  },
  testing: {
    api: {
      local: {
        baseUrl: 'https://localhost:9080',
        port: 9080
      },
      staging: {
        baseUrl: 'https://285361-188maroonwallaby-stage.adobeio-static.net'
      },
      production: {
        baseUrl: 'https://285361-188maroonwallaby.adobeio-static.net'
      },
      defaults: {
        endpoint: 'get-products',
        method: 'POST',
        fields: 'sku,name,price,qty,categories,images'
      }
    },
    performance: {
      scenarios: {
        small: {
          name: 'Small Dataset',
          params: {
            limit: 50,
            include_inventory: true,
            include_categories: true
          }
        },
        medium: {
          name: 'Medium Dataset',
          params: {
            limit: 100,
            include_inventory: true,
            include_categories: true
          }
        },
        large: {
          name: 'Large Dataset',
          params: {
            limit: 200,
            include_inventory: true,
            include_categories: true
          }
        }
      },
      thresholds: {
        executionTime: 0.15,
        memory: 0.10,
        products: 0,
        categories: 0,
        compression: 0.05
      },
      baseline: {
        maxAgeDays: 7
      }
    }
  }
}; 