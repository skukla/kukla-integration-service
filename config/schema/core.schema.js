/**
 * Core configuration schema for the simplified architecture
 * @module config/schema/core
 */

const coreConfigSchema = {
  type: 'object',
  required: ['environment', 'commerce', 'storage', 'runtime', 'performance'],
  properties: {
    environment: {
      type: 'string',
      enum: ['staging', 'production'],
      description: 'Current environment',
    },

    // Products configuration
    products: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Default product fields to export',
        },
        batchSize: {
          type: 'number',
          minimum: 1,
          maximum: 500,
          description: 'Products per batch',
        },
        perPage: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          description: 'Products per page for pagination',
        },
        maxTotal: {
          type: 'number',
          minimum: 1,
          description: 'Maximum total products to fetch',
        },
      },
    },

    // Categories configuration
    categories: {
      type: 'object',
      properties: {
        batchSize: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          description: 'Categories per batch',
        },
        cacheTimeout: {
          type: 'number',
          minimum: 0,
          description: 'Cache timeout in seconds',
        },
        retries: {
          type: 'number',
          minimum: 0,
          description: 'Number of retry attempts',
        },
        retryDelay: {
          type: 'number',
          minimum: 0,
          description: 'Delay between retries in milliseconds',
        },
      },
    },

    // Commerce API configuration
    commerce: {
      type: 'object',
      required: ['baseUrl', 'timeout'],
      properties: {
        baseUrl: {
          type: 'string',
          format: 'uri',
          description: 'Commerce API base URL',
        },
        timeout: {
          type: 'number',
          minimum: 1000,
          maximum: 60000,
          description: 'API timeout in milliseconds',
        },
        retries: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Number of retry attempts',
        },
        retryDelay: {
          type: 'number',
          minimum: 0,
          description: 'Delay between retries in milliseconds',
        },
        paths: {
          type: 'object',
          description: 'API endpoint paths',
        },
        auth: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['token'] },
            tokenRefresh: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                interval: { type: 'number', minimum: 0 },
              },
            },
          },
        },
        batching: {
          type: 'object',
          properties: {
            products: { type: 'number', minimum: 1 },
            inventory: { type: 'number', minimum: 1 },
            maxConcurrent: { type: 'number', minimum: 1 },
            requestDelay: { type: 'number', minimum: 0 },
          },
        },
        caching: {
          type: 'object',
          properties: {
            duration: { type: 'number', minimum: 0 },
          },
        },
        credentials: {
          type: 'object',
          description: 'Runtime credentials (added by loadConfig)',
        },
      },
    },

    // Storage configuration
    storage: {
      type: 'object',
      required: ['provider'],
      properties: {
        provider: {
          type: 'string',
          enum: ['s3', 'app-builder'],
          description: 'Storage provider',
        },
        csv: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            chunkSize: { type: 'number', minimum: 1 },
            compression: { type: 'number', minimum: 0, maximum: 9 },
            bufferSize: { type: 'number', minimum: 1 },
          },
        },
        s3: {
          type: 'object',
          properties: {
            region: { type: 'string' },
            bucket: { type: 'string' },
            prefix: { type: 'string' },
            credentials: {
              type: 'object',
              description: 'Runtime credentials (added by loadConfig)',
            },
          },
        },
      },
    },

    // Runtime configuration
    runtime: {
      type: 'object',
      required: ['package', 'baseUrl', 'namespace'],
      properties: {
        package: { type: 'string' },
        version: { type: 'string' },
        baseUrl: {
          type: 'string',
          format: 'uri',
          description: 'Adobe I/O Runtime base URL',
        },
        namespace: { type: 'string' },
        paths: {
          type: 'object',
          properties: {
            base: { type: 'string' },
            web: { type: 'string' },
            api: { type: 'string' },
          },
        },
      },
    },

    // Performance configuration
    performance: {
      type: 'object',
      properties: {
        maxExecutionTime: {
          type: 'number',
          minimum: 1000,
          description: 'Maximum execution time in milliseconds',
        },
        maxMemoryUsage: {
          type: 'number',
          minimum: 1,
          description: 'Maximum memory usage in MB',
        },
        maxErrorRate: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Maximum error rate percentage',
        },
        tracing: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
            stepLogging: { type: 'boolean' },
            errorVerbosity: { type: 'string', enum: ['summary', 'detailed'] },
            trackTimings: { type: 'boolean' },
            trackMemory: { type: 'boolean' },
          },
        },
      },
    },

    // Testing configuration
    testing: {
      type: 'object',
      properties: {
        timeout: { type: 'number', minimum: 1000 },
        retries: { type: 'number', minimum: 0 },
        logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        scenarios: {
          type: 'object',
          properties: {
            productExport: {
              type: 'object',
              properties: {
                concurrency: { type: 'number', minimum: 1 },
                duration: { type: 'number', minimum: 1 },
                rampUp: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = coreConfigSchema;
