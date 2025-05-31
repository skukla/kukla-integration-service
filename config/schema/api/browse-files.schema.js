/**
 * Schema definitions for browse-files API
 * @module schema/api/browse-files
 */

const { extendRequestSchema, extendResponseSchema } = require('../api.schema');

// Define browse-files specific request properties
const requestExtension = {
  properties: {
    path: {
      type: 'string',
      description: 'Optional path to browse specific directory',
    },
    filter: {
      type: 'string',
      description: 'Optional filter pattern for file names',
    },
  },
};

// Define browse-files specific success response
const successResponseExtension = {
  required: ['files'],
  properties: {
    files: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'path', 'type', 'size', 'modified'],
        properties: {
          name: {
            type: 'string',
            description: 'File name',
          },
          path: {
            type: 'string',
            description: 'Full path to the file',
          },
          type: {
            type: 'string',
            enum: ['file', 'directory'],
            description: 'Type of the entry',
          },
          size: {
            type: 'number',
            description: 'File size in bytes',
          },
          modified: {
            type: 'string',
            format: 'date-time',
            description: 'Last modified timestamp',
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Download URL for the file (only for files)',
          },
        },
      },
      description: 'List of files and directories',
    },
    total: {
      type: 'number',
      description: 'Total number of items',
    },
  },
};

module.exports = {
  request: extendRequestSchema(requestExtension),
  response: extendResponseSchema(successResponseExtension),
};
