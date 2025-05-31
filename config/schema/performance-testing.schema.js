/**
 * Schema definitions for performance testing configuration
 * @module schema/performance-testing
 */

const schema = {
  type: 'object',
  required: ['concurrency', 'duration', 'rampUp'],
  properties: {
    concurrency: {
      type: 'number',
      minimum: 1,
      description: 'Number of concurrent users/requests',
    },
    duration: {
      type: 'number',
      minimum: 1,
      description: 'Test duration in seconds',
    },
    rampUp: {
      type: 'number',
      minimum: 0,
      description: 'Time in seconds to ramp up to full concurrency',
    },
    thresholds: {
      type: 'object',
      properties: {
        responseTime: {
          type: 'object',
          properties: {
            p95: {
              type: 'number',
              minimum: 0,
              description: '95th percentile response time threshold in milliseconds',
            },
            p99: {
              type: 'number',
              minimum: 0,
              description: '99th percentile response time threshold in milliseconds',
            },
          },
        },
        errorRate: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Maximum acceptable error rate percentage',
        },
      },
    },
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'weight'],
        properties: {
          name: {
            type: 'string',
            description: 'Scenario name',
          },
          weight: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Percentage of total traffic for this scenario',
          },
          think: {
            type: 'number',
            minimum: 0,
            description: 'Think time between requests in milliseconds',
          },
        },
      },
    },
  },
};

module.exports = schema;
