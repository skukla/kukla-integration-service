/**
 * API Testing configuration schema
 * @module config/schema/api-testing
 */

const apiTestSchema = {
  type: 'object',
  required: ['api'],
  properties: {
    api: {
      type: 'object',
      required: ['local', 'staging', 'production'],
      properties: {
        local: {
          type: 'object',
          required: ['baseUrl'],
          properties: {
            baseUrl: {
              type: 'string',
              description: 'Local development API base URL',
              pattern: '^https?://.+'
            },
            port: {
              type: 'number',
              description: 'Local development server port',
              default: 9080
            }
          }
        },
        staging: {
          type: 'object',
          required: ['baseUrl'],
          properties: {
            baseUrl: {
              type: 'string',
              description: 'Staging API base URL',
              pattern: '^https?://.+'
            }
          }
        },
        production: {
          type: 'object',
          required: ['baseUrl'],
          properties: {
            baseUrl: {
              type: 'string',
              description: 'Production API base URL',
              pattern: '^https?://.+'
            }
          }
        }
      }
    },
    defaults: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'Default endpoint to test',
          default: 'get-products'
        },
        method: {
          type: 'string',
          description: 'Default HTTP method',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          default: 'POST'
        },
        fields: {
          type: 'string',
          description: 'Default fields to request',
          default: 'sku,name,price,qty,categories,images'
        }
      }
    }
  }
};

module.exports = apiTestSchema; 