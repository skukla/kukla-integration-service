/**
 * Commerce configuration schema
 * @module config/schema/commerce
 */

const commerceSchema = {
  type: 'object',
  required: ['api'],
  properties: {
    api: {
      type: 'object',
      required: ['timeout', 'retry', 'batch', 'cache'],
      properties: {
        timeout: {
          type: 'number',
          description: 'API request timeout in milliseconds',
          default: 30000,
          minimum: 1000
        },
        retry: {
          type: 'object',
          required: ['attempts', 'delay'],
          properties: {
            attempts: {
              type: 'number',
              description: 'Number of retry attempts for failed requests',
              default: 3,
              minimum: 0
            },
            delay: {
              type: 'number',
              description: 'Base delay between retries in milliseconds',
              default: 1000,
              minimum: 100
            }
          }
        },
        batch: {
          type: 'object',
          required: ['size'],
          properties: {
            size: {
              type: 'number',
              description: 'Maximum items per batch operation',
              default: 50,
              minimum: 1,
              maximum: 500
            }
          }
        },
        cache: {
          type: 'object',
          required: ['duration'],
          properties: {
            duration: {
              type: 'number',
              description: 'Cache duration for GET requests in seconds',
              default: 300,
              minimum: 0
            }
          }
        }
      }
    }
  }
};

module.exports = commerceSchema; 