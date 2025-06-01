/**
 * Testing configuration schema
 * @module config/schema/testing
 */

const commonPatterns = require('./common.schema');

const testingSchema = {
  type: 'object',
  required: ['api', 'performance'],
  properties: {
    api: {
      type: 'object',
      required: ['local', 'defaults'],
      properties: {
        local: {
          type: 'object',
          required: ['baseUrl', 'port'],
          properties: {
            baseUrl: commonPatterns.fields.baseUrl,
            port: {
              type: 'number',
              description: 'Port for local API testing',
              default: 9080,
            },
          },
        },
        defaults: {
          type: 'object',
          required: ['endpoint', 'method', 'fields'],
          properties: {
            endpoint: {
              type: 'string',
              description: 'Default API endpoint for testing',
              default: '/products',
            },
            method: {
              type: 'string',
              description: 'Default HTTP method for testing',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              default: 'GET',
            },
            fields: {
              type: 'array',
              description: 'Default fields to request in API tests',
              items: {
                type: 'string',
              },
              default: ['sku', 'name'],
            },
          },
        },
        timeout: commonPatterns.fields.timeout,
        retry: commonPatterns.retry,
        logLevel: commonPatterns.fields.logLevel,
      },
    },
    performance: {
      type: 'object',
      required: ['scenarios', 'thresholds', 'baseline'],
      properties: {
        scenarios: {
          type: 'object',
          description: 'Performance test scenarios',
          patternProperties: {
            '^[a-zA-Z0-9_-]+$': {
              type: 'object',
              required: ['name', 'description', 'steps'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Scenario name',
                },
                description: {
                  type: 'string',
                  description: 'Scenario description',
                },
                steps: {
                  type: 'array',
                  description: 'Test steps to execute',
                  items: {
                    type: 'object',
                    required: ['name', 'type'],
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Step name',
                      },
                      type: {
                        type: 'string',
                        description: 'Step type',
                        enum: ['api', 'data', 'storage'],
                      },
                      config: {
                        type: 'object',
                        description: 'Step configuration',
                      },
                      weight: {
                        type: 'number',
                        description: 'Step weight in the scenario',
                        minimum: 0,
                        maximum: 100,
                        default: 1,
                      },
                      think: {
                        type: 'number',
                        description: 'Think time between steps in milliseconds',
                        minimum: 0,
                        default: 0,
                      },
                    },
                  },
                },
                concurrency: {
                  type: 'number',
                  description: 'Number of concurrent users/requests',
                  minimum: 1,
                  default: 1,
                },
                duration: {
                  type: 'number',
                  description: 'Test duration in seconds',
                  minimum: 1,
                  default: 60,
                },
                rampUp: {
                  type: 'number',
                  description: 'Time in seconds to ramp up to full concurrency',
                  minimum: 0,
                  default: 0,
                },
              },
            },
          },
        },
        thresholds: {
          type: 'object',
          required: ['executionTime', 'memory', 'products', 'categories', 'compression'],
          properties: {
            ...commonPatterns.performanceThresholds.properties,
            products: {
              type: 'number',
              description: 'Maximum number of products to process per second',
              minimum: 0,
              default: 100,
            },
            categories: {
              type: 'number',
              description: 'Maximum number of categories to process per second',
              minimum: 0,
              default: 50,
            },
            compression: {
              type: 'number',
              description: 'Minimum compression ratio',
              minimum: 0,
              maximum: 1,
              default: 0.5,
            },
            responseTime: {
              type: 'object',
              properties: {
                p95: {
                  type: 'number',
                  description: '95th percentile response time in milliseconds',
                  minimum: 0,
                  default: 1000,
                },
                p99: {
                  type: 'number',
                  description: '99th percentile response time in milliseconds',
                  minimum: 0,
                  default: 2000,
                },
              },
            },
            errorRate: {
              type: 'number',
              description: 'Maximum acceptable error rate percentage',
              minimum: 0,
              maximum: 100,
              default: 1,
            },
          },
        },
        baseline: {
          type: 'object',
          required: ['maxAgeDays'],
          properties: {
            maxAgeDays: {
              type: 'number',
              description: 'Maximum age of baseline data in days',
              minimum: 1,
              default: 30,
            },
          },
        },
      },
    },
  },
};

module.exports = testingSchema;
