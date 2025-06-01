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
      required: ['timeout', 'retry', 'batch', 'cache', 'concurrency'],
      properties: {
        timeout: {
          type: 'number',
          description: 'API request timeout in milliseconds',
          default: 30000,
          minimum: 1000,
        },
        retry: {
          type: 'object',
          required: ['attempts', 'delay'],
          properties: {
            attempts: {
              type: 'number',
              description: 'Number of retry attempts for failed requests',
              default: 3,
              minimum: 0,
            },
            delay: {
              type: 'number',
              description: 'Base delay between retries in milliseconds',
              default: 1000,
              minimum: 100,
            },
          },
        },
        batch: {
          type: 'object',
          required: ['size', 'inventory', 'delay'],
          properties: {
            size: {
              type: 'number',
              description: 'Maximum items per batch operation',
              default: 50,
              minimum: 1,
              maximum: 500,
            },
            inventory: {
              type: 'number',
              description: 'Number of products to process in each inventory batch',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
            delay: {
              type: 'number',
              description: 'Delay between batch operations in milliseconds',
              default: 100,
              minimum: 0,
              maximum: 5000,
            },
          },
        },
        cache: {
          type: 'object',
          required: ['duration'],
          properties: {
            duration: {
              type: 'number',
              description: 'Cache duration for GET requests in seconds',
              default: 3600,
              minimum: 0,
            },
          },
        },
        concurrency: {
          type: 'object',
          required: ['maxRequests'],
          properties: {
            maxRequests: {
              type: 'number',
              description: 'Maximum number of concurrent API requests',
              default: 10,
              minimum: 1,
              maximum: 50,
            },
          },
        },
      },
    },
    limits: {
      type: 'object',
      description: 'System-wide limits and constraints',
      properties: {
        batch: {
          type: 'object',
          properties: {
            maxSize: {
              type: 'number',
              description: 'Maximum allowed batch size',
              default: 500,
            },
            maxInventorySize: {
              type: 'number',
              description: 'Maximum allowed inventory batch size',
              default: 100,
            },
          },
        },
        concurrency: {
          type: 'object',
          properties: {
            maxRequests: {
              type: 'number',
              description: 'Maximum allowed concurrent requests',
              default: 50,
            },
          },
        },
        timeout: {
          type: 'object',
          properties: {
            minimum: {
              type: 'number',
              description: 'Minimum allowed timeout in milliseconds',
              default: 1000,
            },
          },
        },
        retry: {
          type: 'object',
          properties: {
            minDelay: {
              type: 'number',
              description: 'Minimum allowed retry delay in milliseconds',
              default: 100,
            },
          },
        },
      },
    },
  },
};

module.exports = commerceSchema;
