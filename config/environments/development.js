/**
 * Development environment configuration
 * @module config/environments/development
 */

module.exports = {
  app: {
    runtime: {
      environment: 'development',
      features: {
        debugLogging: true,
        performanceMonitoring: true
      }
    },
    logging: {
      level: 'debug',
      format: 'text'
    },
    performance: {
      monitoring: {
        enabled: true,
        sampleRate: 1.0 // Monitor all requests in development
      }
    }
  },
  url: {
    runtime: {
      baseUrl: 'https://localhost:9080',
      namespace: 'local',
      package: 'kukla-integration-service'
    },
    frontend: {
      baseUrl: 'http://localhost:8080'
    }
  },
  commerce: {
    api: {
      timeout: 60000, // Longer timeout for debugging
      retry: {
        attempts: 1, // Fewer retries in development
        delay: 1000
      },
      batch: {
        size: 10 // Smaller batch size for easier debugging
      },
      cache: {
        duration: 0 // Disable caching in development
      }
    }
  },
  security: {
    authentication: {
      commerce: {
        type: 'basic',
        tokenRefresh: {
          enabled: false // Disable token refresh in development
        }
      }
    },
    rateLimit: {
      enabled: false // Disable rate limiting in development
    }
  }
}; 