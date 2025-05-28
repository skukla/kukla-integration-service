/**
 * Application configuration schema
 * @module config/schema/app
 */

const appSchema = {
  type: 'object',
  required: ['runtime', 'performance'],
  properties: {
    runtime: {
      type: 'object',
      required: ['environment'],
      properties: {
        environment: {
          type: 'string',
          description: 'Current runtime environment',
          enum: ['development', 'staging', 'production']
        }
      }
    },
    performance: {
      type: 'object',
      required: ['thresholds'],
      properties: {
        thresholds: {
          type: 'object',
          required: ['api', 'rendering'],
          properties: {
            api: {
              type: 'object',
              required: ['warning', 'critical'],
              properties: {
                warning: {
                  type: 'number',
                  description: 'Warning threshold for API response time (ms)',
                  default: 1000
                },
                critical: {
                  type: 'number',
                  description: 'Critical threshold for API response time (ms)',
                  default: 3000
                }
              }
            },
            rendering: {
              type: 'object',
              required: ['warning', 'critical'],
              properties: {
                warning: {
                  type: 'number',
                  description: 'Warning threshold for page rendering time (ms)',
                  default: 300
                },
                critical: {
                  type: 'number',
                  description: 'Critical threshold for page rendering time (ms)',
                  default: 1000
                }
              }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              description: 'Enable performance monitoring',
              default: true
            },
            sampleRate: {
              type: 'number',
              description: 'Performance monitoring sample rate (0-1)',
              minimum: 0,
              maximum: 1,
              default: 0.1
            }
          }
        }
      }
    },
    storage: {
      type: 'object',
      properties: {
        files: {
          type: 'object',
          properties: {
            publicDir: {
              type: 'string',
              description: 'Public files directory',
              default: 'public'
            },
            tempDir: {
              type: 'string',
              description: 'Temporary files directory',
              default: 'temp'
            },
            maxFileSize: {
              type: 'number',
              description: 'Maximum file size in bytes',
              default: 104857600 // 100MB
            }
          }
        },
        csv: {
          type: 'object',
          properties: {
            chunkSize: {
              type: 'number',
              description: 'CSV processing chunk size',
              default: 100
            },
            compressionLevel: {
              type: 'number',
              description: 'CSV compression level (0-9)',
              minimum: 0,
              maximum: 9,
              default: 6
            },
            streamBufferSize: {
              type: 'number',
              description: 'CSV stream buffer size in bytes',
              default: 16384
            }
          }
        }
      }
    }
  }
};

module.exports = appSchema; 