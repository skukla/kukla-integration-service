/**
 * Common schema patterns
 * @module config/schema/common
 */

const commonPatterns = {
  // Common field types
  fields: {
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds',
      minimum: 1000,
      default: 30000,
    },
    baseUrl: {
      type: 'string',
      description: 'Base URL',
      pattern: '^https?://.+',
    },
    version: {
      type: 'string',
      description: 'API version',
    },
    logLevel: {
      type: 'string',
      enum: ['error', 'warn', 'info', 'debug'],
      description: 'Logging level',
    },
  },

  // Common retry pattern
  retry: {
    type: 'object',
    required: ['attempts', 'delay'],
    properties: {
      attempts: {
        type: 'number',
        description: 'Number of retry attempts',
        minimum: 0,
        default: 3,
      },
      delay: {
        type: 'number',
        description: 'Delay between retries in milliseconds',
        minimum: 100,
        default: 1000,
      },
    },
  },

  // Common batch processing pattern
  batch: {
    type: 'object',
    required: ['size', 'delay'],
    properties: {
      size: {
        type: 'number',
        description: 'Batch size',
        minimum: 1,
        maximum: 500,
        default: 50,
      },
      delay: {
        type: 'number',
        description: 'Delay between batches in milliseconds',
        minimum: 0,
        maximum: 5000,
        default: 100,
      },
    },
  },

  // Common performance thresholds pattern
  performanceThresholds: {
    type: 'object',
    properties: {
      executionTime: {
        type: 'number',
        description: 'Maximum execution time in milliseconds',
        minimum: 0,
      },
      memory: {
        type: 'number',
        description: 'Maximum memory usage in MB',
        minimum: 0,
      },
    },
  },

  // Common message pattern
  message: {
    type: 'object',
    required: ['text', 'type'],
    properties: {
      text: {
        type: 'string',
        description: 'Message text',
      },
      type: {
        type: 'string',
        enum: ['info', 'warning', 'error', 'success'],
        description: 'Message type',
      },
    },
  },

  // Common pagination pattern
  pagination: {
    type: 'object',
    properties: {
      pageSize: {
        type: 'number',
        description: 'Number of items per page',
        minimum: 1,
        maximum: 500,
        default: 100,
      },
      maxPages: {
        type: 'number',
        description: 'Maximum number of pages',
        minimum: 1,
        default: 50,
      },
    },
  },

  // Common tracing pattern
  tracing: {
    type: 'object',
    required: ['enabled'],
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Whether tracing is enabled',
        default: false,
      },
      sampleRate: {
        type: 'number',
        description: 'Percentage of requests to trace (0-1)',
        minimum: 0,
        maximum: 1,
        default: 0.1,
      },
      exporters: {
        type: 'array',
        description: 'List of trace exporters to use',
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['console', 'jaeger', 'zipkin', 'otlp'],
              description: 'Type of trace exporter',
            },
            endpoint: {
              type: 'string',
              description: 'Endpoint for the trace exporter',
            },
            headers: {
              type: 'object',
              description: 'Headers to include with trace export',
              additionalProperties: true,
            },
          },
        },
        default: [{ type: 'console' }],
      },
      attributes: {
        type: 'object',
        description: 'Default attributes to add to all spans',
        additionalProperties: true,
      },
      ignoreUrls: {
        type: 'array',
        description: 'URLs to ignore for tracing',
        items: {
          type: 'string',
          format: 'regex',
        },
        default: ['^/health$', '^/metrics$'],
      },
    },
  },
};

module.exports = commonPatterns;
