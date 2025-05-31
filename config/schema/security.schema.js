/**
 * Security configuration schema
 * @module config/schema/security
 */

const securitySchema = {
  type: 'object',
  required: ['authentication'],
  properties: {
    authentication: {
      type: 'object',
      required: ['commerce'],
      properties: {
        commerce: {
          type: 'object',
          required: ['type', 'tokenRefresh'],
          properties: {
            type: {
              type: 'string',
              enum: ['basic', 'token'],
              description: 'Authentication type for Commerce API',
            },
            tokenRefresh: {
              type: 'object',
              required: ['enabled', 'interval'],
              properties: {
                enabled: {
                  type: 'boolean',
                  description: 'Whether to enable token refresh',
                },
                interval: {
                  type: 'number',
                  minimum: 300,
                  description: 'Token refresh interval in seconds',
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = securitySchema;
