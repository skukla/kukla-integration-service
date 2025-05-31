/**
 * Schema definitions for API testing configuration
 * @module schema/api-testing
 */

const schema = {
  type: 'object',
  required: ['baseUrl', 'timeout'],
  properties: {
    baseUrl: {
      type: 'string',
      format: 'uri',
      description: 'Base URL for API endpoints',
    },
    timeout: {
      type: 'number',
      minimum: 1000,
      description: 'Request timeout in milliseconds',
    },
    retries: {
      type: 'number',
      minimum: 0,
      default: 3,
      description: 'Number of retry attempts for failed requests',
    },
    delay: {
      type: 'number',
      minimum: 0,
      default: 1000,
      description: 'Delay between retry attempts in milliseconds',
    },
    logLevel: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      description: 'Logging level for tests',
    },
  },
};

module.exports = schema;
