/**
 * Test default configuration
 * @module config/defaults/test
 */

module.exports = {
  api: {
    local: {
      baseUrl: 'https://localhost:9080/api/v1/web/kukla-integration-service',
      port: 9080
    },
    staging: {
      baseUrl: 'https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service'
    },
    production: {
      baseUrl: 'https://285361-188maroonwallaby.adobeio-static.net/api/v1/web/kukla-integration-service'
    }
  },
  defaults: {
    endpoint: 'get-products',
    method: 'POST',
    fields: 'sku,name,price,qty,categories,images'
  }
}; 