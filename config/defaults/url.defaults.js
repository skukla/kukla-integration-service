/**
 * URL default configuration
 * @module config/defaults/url
 */

module.exports = {
  runtime: {
    baseUrl: 'https://adobeioruntime.net',
    namespace: '285361-188maroonwallaby',
    package: 'kukla-integration-service',
    version: 'v1',
    paths: {
      web: '/web',
      base: '/api'
    }
  },
  commerce: {
    version: 'V1',
    paths: {
      products: '/products/:id?',
      categories: '/categories/:id?',
      inventory: '/inventory/:sku/source-items'
    }
  },
  frontend: {
    routes: {
      home: '/',
      products: '/products',
      categories: '/categories',
      files: '/files',
      download: '/download/:filename'
    }
  }
}; 