/**
 * URL configuration schema
 * @module config/schema/url
 */

const urlSchema = {
  type: 'object',
  required: ['runtime', 'commerce'],
  properties: {
    runtime: {
      type: 'object',
      required: ['baseUrl', 'namespace', 'package'],
      properties: {
        baseUrl: {
          type: 'string',
          description: 'Base URL for Adobe I/O Runtime',
          pattern: '^https?://.+'
        },
        namespace: {
          type: 'string',
          description: 'Adobe I/O Runtime namespace'
        },
        package: {
          type: 'string',
          description: 'App Builder package name',
          default: 'kukla-integration-service'
        },
        version: {
          type: 'string',
          description: 'API version',
          default: 'v1'
        },
        paths: {
          type: 'object',
          required: ['web', 'base'],
          properties: {
            web: {
              type: 'string',
              description: 'Web path segment',
              default: '/web'
            },
            base: {
              type: 'string',
              description: 'Base path segment',
              default: '/api'
            }
          }
        }
      }
    },
    commerce: {
      type: 'object',
      required: ['baseUrl', 'version'],
      properties: {
        baseUrl: {
          type: 'string',
          description: 'Base URL for Commerce API',
          pattern: '^https?://.+'
        },
        version: {
          type: 'string',
          description: 'Commerce API version',
          default: 'V1'
        },
        paths: {
          type: 'object',
          description: 'Commerce API path templates',
          properties: {
            products: {
              type: 'string',
              description: 'Product path template',
              default: '/products/:id?'
            },
            categories: {
              type: 'string',
              description: 'Category path template',
              default: '/categories/:id?'
            },
            inventory: {
              type: 'string',
              description: 'Inventory path template',
              default: '/inventory/:sku/source-items'
            }
          }
        }
      }
    }
  }
};

module.exports = urlSchema; 