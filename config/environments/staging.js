/**
 * Staging environment configuration
 * @module config/environments/staging
 */

module.exports = {
  app: {
    runtime: {
      environment: 'staging',
      features: {
        debugLogging: false,
        performanceMonitoring: true
      }
    },
    logging: {
      level: 'info',
      format: 'json'
    },
    performance: {
      monitoring: {
        enabled: true,
        sampleRate: 0.5 // Monitor 50% of requests in staging
      }
    }
  },
  url: {
    runtime: {
      baseUrl: 'https://adobeioruntime.net',
      namespace: '285361-188maroonwallaby-stage'
    },
    frontend: {
      baseUrl: 'https://285361-188maroonwallaby-stage.adobeio-static.net'
    }
  },
  commerce: {
    api: {
      timeout: 45000, // 45 second timeout
      retry: {
        attempts: 2,
        delay: 1000
      },
      batch: {
        size: 25 // Moderate batch size for staging
      },
      cache: {
        duration: 60 // 1 minute cache in staging
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
      max: 200 // Higher limit than production
    }
  }
}; 