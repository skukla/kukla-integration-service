/**
 * Staging environment configuration
 * @module config/environments/staging
 */

module.exports = {
  app: {
    runtime: {
      environment: 'staging'
    }
  },
  url: {
    runtime: {
      baseUrl: 'https://adobeioruntime.net',
      namespace: '285361-188maroonwallaby-stage',
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
      timeout: 45000, // 45 second timeout
      retry: {
        attempts: 2,
        delay: 1000
      },
      batch: {
        size: 25 // Moderate batch size for staging
      },
      cache: {
        duration: 60 // 1 minute cache in staging
      }
    }
  },
  security: {
    authentication: {
      commerce: {
        type: 'token',
        tokenRefresh: {
          enabled: true
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