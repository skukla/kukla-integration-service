/**
 * Timeouts Domain Configuration
 * @module config/domains/timeouts
 *
 * Used by: All actions for timeout management
 * ⚙️ Key settings: API timeouts, runtime timeouts, source-specific timeouts
 */

/**
 * Build timeout configurations
 * @returns {Object} Timeout configuration
 */
function buildTimeoutConfig() {
  return {
    api: {
      commerce: 30000, // Commerce API timeout
      mesh: 30000, // Mesh GraphQL timeout
      testing: 10000, // Testing API timeout
    },
    runtime: {
      cli: 5000, // CLI detection timeout
      action: 30000, // Action execution timeout
      testing: 10000, // Jest/testing timeout
    },
    // Source-specific timeouts for different Commerce APIs
    sources: {
      products: 30000, // Products API - normal timeout
      categories: 30000, // Categories API - normal timeout
      inventory: 15000, // Inventory API - faster timeout (changes frequently)
    },
  };
}

module.exports = {
  buildTimeoutConfig,
};
