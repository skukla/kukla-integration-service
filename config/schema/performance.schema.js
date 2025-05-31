/**
 * Performance configuration schema
 * @module config/schema/performance
 */

const schema = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Enable/disable performance monitoring',
    },
    monitoring: {
      type: 'object',
      properties: {
        sampleRate: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.1,
          description: 'Fraction of requests to monitor (0-1)',
        },
        slowThreshold: {
          type: 'number',
          minimum: 0,
          default: 1000,
          description: 'Threshold in ms for slow operation alerts',
        },
      },
    },
    testing: {
      type: 'object',
      properties: {
        scenarios: {
          type: 'object',
          properties: {
            small: {
              type: 'object',
              properties: {
                products: { type: 'number', default: 100 },
                categories: { type: 'number', default: 10 },
              },
            },
            medium: {
              type: 'object',
              properties: {
                products: { type: 'number', default: 1000 },
                categories: { type: 'number', default: 50 },
              },
            },
            large: {
              type: 'object',
              properties: {
                products: { type: 'number', default: 10000 },
                categories: { type: 'number', default: 100 },
              },
            },
          },
        },
        iterations: {
          type: 'number',
          minimum: 1,
          default: 3,
          description: 'Number of test iterations to run',
        },
        warmup: {
          type: 'boolean',
          default: true,
          description: 'Run warmup iteration before tests',
        },
      },
    },
  },
};

module.exports = schema;
