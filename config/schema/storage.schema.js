/**
 * Storage configuration schema
 * @module config/schema/storage
 */

module.exports = {
  type: 'object',
  properties: {
    csv: {
      type: 'object',
      properties: {
        chunkSize: {
          type: 'number',
          minimum: 1,
          default: 100,
        },
        compressionLevel: {
          type: 'number',
          minimum: 1,
          maximum: 9,
          default: 6,
        },
        streamBufferSize: {
          type: 'number',
          minimum: 1024,
          default: 16384,
        },
      },
      required: ['chunkSize', 'compressionLevel', 'streamBufferSize'],
      additionalProperties: false,
    },
  },
  required: ['csv'],
  additionalProperties: false,
};
