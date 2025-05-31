/**
 * Schema definitions for get-products API
 * @module schema/api/get-products
 */

const {
  data: {
    product: { PRODUCT_FIELDS },
  },
} = require('../../../src/commerce');
const { extendRequestSchema, extendResponseSchema } = require('../api.schema');

// Define get-products specific request properties
const requestExtension = {
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'string',
        enum: [...PRODUCT_FIELDS.REQUIRED, ...PRODUCT_FIELDS.OPTIONAL],
      },
      description: 'List of fields to include in the response',
    },
  },
};

// Define get-products specific success response
const successResponseExtension = {
  required: ['file'],
  properties: {
    file: {
      type: 'object',
      required: ['name', 'url'],
      properties: {
        name: {
          type: 'string',
          description: 'Name of the generated file',
        },
        url: {
          type: 'string',
          format: 'uri',
          description: 'URL to download the file',
        },
      },
    },
  },
};

module.exports = {
  request: extendRequestSchema(requestExtension),
  response: extendResponseSchema(successResponseExtension),
};
