/**
 * Simplified API schemas for actual actions
 * @module config/schema/api
 */

// Base request schema for all actions
const baseRequestSchema = {
  type: 'object',
  properties: {
    // Adobe I/O Runtime provides these automatically
    __ow_method: { type: 'string' },
    __ow_headers: { type: 'object' },
    __ow_path: { type: 'string' },
    __ow_user: { type: 'string' },
    __ow_body: { type: 'string' },

    // Environment detection
    NODE_ENV: { type: 'string', enum: ['staging', 'production'] },

    // Common credentials (added via app.config.yaml)
    COMMERCE_ADMIN_USERNAME: { type: 'string' },
    COMMERCE_ADMIN_PASSWORD: { type: 'string' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
  },
};

// Base response schema for all actions
const baseResponseSchema = {
  type: 'object',
  required: ['statusCode', 'headers', 'body'],
  properties: {
    statusCode: { type: 'number' },
    headers: {
      type: 'object',
      properties: {
        'Content-Type': { type: 'string' },
        'Access-Control-Allow-Origin': { type: 'string' },
        'Access-Control-Allow-Methods': { type: 'string' },
        'Access-Control-Allow-Headers': { type: 'string' },
      },
    },
    body: {
      oneOf: [
        // Success response
        {
          type: 'object',
          required: ['success'],
          properties: {
            success: { type: 'boolean', const: true },
            message: { type: 'string' },
            steps: {
              type: 'array',
              items: { type: 'string' },
            },
            downloadUrl: { type: 'string', format: 'uri' },
            storage: {
              type: 'object',
              properties: {
                provider: { type: 'string', enum: ['s3', 'app-builder'] },
                location: { type: 'string' },
                properties: { type: 'object' },
              },
            },
          },
        },
        // Error response
        {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', const: false },
            error: { type: 'string' },
            details: { type: 'string' },
          },
        },
      ],
    },
  },
};

// get-products action schemas
const getProductsSchema = {
  request: {
    ...baseRequestSchema,
    required: ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'],
    properties: {
      ...baseRequestSchema.properties,
      // Optional query parameters
      category: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 1000 },
      fields: {
        type: 'array',
        items: { type: 'string' },
        uniqueItems: true,
      },
    },
  },
  response: baseResponseSchema,
};

// browse-files action schemas
const browseFilesSchema = {
  request: {
    ...baseRequestSchema,
    required: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  },
  response: {
    ...baseResponseSchema,
    properties: {
      ...baseResponseSchema.properties,
      headers: {
        ...baseResponseSchema.properties.headers,
        properties: {
          ...baseResponseSchema.properties.headers.properties,
          'Content-Type': { type: 'string', const: 'text/html' },
        },
      },
    },
  },
};

// download-file action schemas
const downloadFileSchema = {
  request: {
    ...baseRequestSchema,
    required: ['fileName', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    properties: {
      ...baseRequestSchema.properties,
      fileName: { type: 'string', minLength: 1 },
      fullPath: { type: 'string' },
    },
  },
  response: {
    type: 'object',
    required: ['statusCode', 'headers'],
    properties: {
      statusCode: { type: 'number' },
      headers: {
        type: 'object',
        properties: {
          'Content-Type': { type: 'string' },
          'Content-Disposition': { type: 'string' },
          'Content-Length': { type: 'string' },
        },
      },
      body: { type: 'string', description: 'File content as string or buffer' },
    },
  },
};

// delete-file action schemas
const deleteFileSchema = {
  request: {
    ...baseRequestSchema,
    required: ['fileName', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    properties: {
      ...baseRequestSchema.properties,
      fileName: { type: 'string', minLength: 1 },
      fullPath: { type: 'string' },
    },
  },
  response: baseResponseSchema,
};

// Frontend configuration schema (for generated config)
const frontendConfigSchema = {
  type: 'object',
  required: ['environment', 'runtime', 'performance'],
  properties: {
    environment: { type: 'string', enum: ['staging', 'production'] },
    runtime: {
      type: 'object',
      required: ['package', 'version', 'baseUrl', 'namespace', 'paths', 'actions'],
      properties: {
        package: { type: 'string' },
        version: { type: 'string' },
        baseUrl: { type: 'string', format: 'uri' },
        namespace: { type: 'string' },
        paths: {
          type: 'object',
          required: ['base', 'web'],
          properties: {
            base: { type: 'string' },
            web: { type: 'string' },
          },
        },
        actions: {
          type: 'object',
          properties: {
            'get-products': { type: 'string' },
            'browse-files': { type: 'string' },
            'download-file': { type: 'string' },
            'delete-file': { type: 'string' },
          },
        },
      },
    },
    performance: {
      type: 'object',
      required: ['timeout'],
      properties: {
        timeout: { type: 'number', minimum: 1000 },
        maxExecutionTime: { type: 'number', minimum: 1000 },
      },
    },
  },
};

module.exports = {
  // Base schemas
  baseRequestSchema,
  baseResponseSchema,

  // Action-specific schemas
  getProductsSchema,
  browseFilesSchema,
  downloadFileSchema,
  deleteFileSchema,

  // Frontend schema
  frontendConfigSchema,

  // Action schemas by name (for easy lookup)
  actions: {
    'get-products': getProductsSchema,
    'browse-files': browseFilesSchema,
    'download-file': downloadFileSchema,
    'delete-file': deleteFileSchema,
  },
};
