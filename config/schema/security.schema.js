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
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              description: 'Authentication type for Commerce API',
              enum: ['basic', 'token'],
              default: 'basic'
            },
            credentials: {
              type: 'object',
              description: 'Credential configuration (populated from environment)',
              properties: {
                username: {
                  type: 'string',
                  description: 'Commerce admin username'
                },
                password: {
                  type: 'string',
                  description: 'Commerce admin password'
                },
                token: {
                  type: 'string',
                  description: 'Commerce API token'
                }
              }
            },
            tokenRefresh: {
              type: 'object',
              properties: {
                enabled: {
                  type: 'boolean',
                  description: 'Enable token refresh',
                  default: true
                },
                threshold: {
                  type: 'number',
                  description: 'Token refresh threshold in seconds',
                  default: 300
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = securitySchema; 