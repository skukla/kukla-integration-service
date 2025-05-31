/**
 * Schema definitions for download-file API
 * @module schema/api/download-file
 */

const { extendRequestSchema, extendResponseSchema } = require('../api.schema');

// Define download-file specific request properties
const requestExtension = {
  required: ['filename'],
  properties: {
    filename: {
      type: 'string',
      description: 'Name or path of the file to download',
    },
    format: {
      type: 'string',
      enum: ['raw', 'base64'],
      default: 'raw',
      description: 'Format of the file content in the response',
    },
  },
};

// Define download-file specific success response
const successResponseExtension = {
  required: ['file'],
  properties: {
    file: {
      type: 'object',
      required: ['name', 'content', 'contentType', 'size'],
      properties: {
        name: {
          type: 'string',
          description: 'Original file name',
        },
        content: {
          type: 'string',
          description: 'File content (raw or base64 encoded)',
        },
        contentType: {
          type: 'string',
          description: 'MIME type of the file',
        },
        size: {
          type: 'number',
          description: 'File size in bytes',
        },
        encoding: {
          type: 'string',
          enum: ['raw', 'base64'],
          description: 'Encoding of the file content',
        },
        modified: {
          type: 'string',
          format: 'date-time',
          description: 'Last modified timestamp',
        },
      },
    },
  },
};

module.exports = {
  request: extendRequestSchema(requestExtension),
  response: extendResponseSchema(successResponseExtension),
};
