/**
 * Production environment configuration
 * @module config/environments/production
 */

module.exports = {
  app: {
    runtime: {
      environment: 'production',
      features: {
        debugLogging: false,
        performanceMonitoring: true
      }
    },
    logging: {
      level: 'warn', // Only log warnings and errors in production
      format: 'json'
    },
    performance: {
      monitoring: {
        enabled: true,
        sampleRate: 0.1 // Monitor 10% of requests in production
      }
    }
  },
  url: {
    runtime: {
      baseUrl: 'https://adobeioruntime.net',
      namespace: '285361-188maroonwallaby'
    },
    frontend: {
      baseUrl: 'https://285361-188maroonwallaby.adobeio-static.net'
    }
  },
  commerce: {
    api: {
      timeout: 30000, // 30 second timeout
      retry: {
        attempts: 3,
        delay: 1000
      },
      batch: {
        size: 50 // Full batch size for production
      },
      cache: {
        duration: 300 // 5 minute cache in production
      }
    }
  },
  security: {
    authentication: {
      commerce: {
        type: 'token',
        tokenRefresh: {
          enabled: true
        }
      }
    },
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      max: 100 // Stricter limit in production
    }
  }
}; 