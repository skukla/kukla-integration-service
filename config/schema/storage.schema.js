/**
 * Storage configuration schema
 * @module config/schema/storage
 */

module.exports = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      enum: ['app-builder', 's3'],
      default: 'app-builder',
      description: 'Storage provider to use: app-builder (Adobe I/O Files) or s3 (AWS S3)',
    },
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
        filename: {
          type: 'string',
          minLength: 1,
          default: 'products.csv',
          description: 'Fixed filename for consistent URLs across regenerations',
        },
      },
      required: ['chunkSize', 'compressionLevel', 'streamBufferSize', 'filename'],
      additionalProperties: false,
    },
    s3: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          default: 'us-east-1',
          description: 'AWS S3 region',
        },
        bucket: {
          type: 'string',
          description: 'S3 bucket name',
        },
        accessKeyId: {
          type: 'string',
          description: 'AWS access key ID (can be set via AWS_ACCESS_KEY_ID env var)',
        },
        secretAccessKey: {
          type: 'string',
          description: 'AWS secret access key (can be set via AWS_SECRET_ACCESS_KEY env var)',
        },
        prefix: {
          type: 'string',
          default: '',
          description: 'Optional prefix for all stored files',
        },
      },
      required: ['bucket'],
      additionalProperties: false,
    },
  },
  required: ['provider', 'csv'],
  additionalProperties: false,
};
