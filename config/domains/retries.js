/**
 * Retry Domain Configuration
 * @module config/domains/retries
 *
 * Used by: All actions for retry logic and error recovery
 * ⚙️ Key settings: Retry attempts, delays, source-specific retry strategies
 */

/**
 * Build retry configurations
 * @returns {Object} Retry configuration
 */
function buildRetryConfig() {
  return {
    attempts: 3, // Default retry attempts
    delay: 1000, // Default delay between retries in ms
    api: {
      commerce: { attempts: 3, delay: 1000 },
      mesh: { attempts: 3, delay: 1000 },
    },
    sources: {
      products: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: '5xx',
        exponentialBackoff: true,
      },
      categories: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: '5xx',
        exponentialBackoff: true,
      },
      inventory: {
        maxRetries: 5, // More retries for inventory (changes frequently)
        retryDelay: 500, // Faster retry for inventory
        retryCondition: '5xx',
        exponentialBackoff: true,
      },
    },
    // Connection pooling configuration for different sources
    connectionPool: {
      sources: {
        products: {
          maxSockets: 10,
          maxFreeSockets: 5,
          timeout: 30000,
          freeSocketTimeout: 5000,
        },
        categories: {
          maxSockets: 10,
          maxFreeSockets: 5,
          timeout: 30000,
          freeSocketTimeout: 5000,
        },
        inventory: {
          maxSockets: 15, // More connections for inventory API
          maxFreeSockets: 8,
          timeout: 15000, // Shorter timeout for inventory
          freeSocketTimeout: 3000,
        },
      },
    },
  };
}

module.exports = {
  buildRetryConfig,
};
