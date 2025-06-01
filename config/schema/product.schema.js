/**
 * Product configuration schema
 * @module config/schema/product
 */

const schema = {
  type: 'object',
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      },
      default: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      description: 'Product fields to include in the response',
    },
    pagination: {
      type: 'object',
      properties: {
        pageSize: {
          type: 'number',
          minimum: 1,
          maximum: 500,
          default: 100,
          description: 'Number of products per page in API requests',
        },
        maxPages: {
          type: 'number',
          minimum: 1,
          default: 50,
          description: 'Maximum number of pages to fetch in a single request',
        },
      },
      default: {
        pageSize: 100,
        maxPages: 50,
      },
      description: 'Pagination settings for product API requests',
    },
    validation: {
      type: 'object',
      properties: {
        sku: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Regex pattern for SKU validation',
            },
            message: {
              type: 'string',
              description: 'Validation error message',
            },
          },
        },
        name: {
          type: 'object',
          properties: {
            minLength: {
              type: 'number',
              description: 'Minimum name length',
            },
            maxLength: {
              type: 'number',
              description: 'Maximum name length',
            },
            message: {
              type: 'string',
              description: 'Validation error message',
            },
          },
        },
        price: {
          type: 'object',
          properties: {
            min: {
              type: 'number',
              description: 'Minimum price value',
            },
            message: {
              type: 'string',
              description: 'Validation error message',
            },
          },
        },
        qty: {
          type: 'object',
          properties: {
            min: {
              type: 'number',
              description: 'Minimum quantity value',
            },
            message: {
              type: 'string',
              description: 'Validation error message',
            },
          },
        },
      },
    },
  },
  required: ['fields'],
};

module.exports = schema;
