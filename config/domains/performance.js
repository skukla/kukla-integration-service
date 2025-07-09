/**
 * Performance Domain Configuration
 * @module config/domains/performance
 *
 * 🎯 Used by: All actions for monitoring and optimization
 * ⚙️ Key settings: Technical monitoring, optimization flags, advanced performance settings
 *
 * 📋 Shared settings: Uses main configuration for timeouts, memory, retries, batching, caching
 */

/**
 * Build performance configuration
 * @param {Object} [mainConfig] - Shared main configuration
 * @returns {Object} Performance configuration
 */
function buildPerformanceConfig(mainConfig = {}) {
  return {
    // 🔗 SHARED VALUES: Reference main configuration for business defaults
    maxExecutionTime: mainConfig.timeouts?.actionExecution || 30000,

    timeouts: {
      // 🔗 SHARED: Business API timeouts from main
      api: {
        commerce: mainConfig.timeouts?.commerceApi || 30000,
        mesh: mainConfig.timeouts?.meshApi || 30000,
        testing: 10000, // Technical setting specific to performance testing
      },
      // 🔧 TECHNICAL: Performance-specific runtime timeouts
      runtime: {
        cli: 5000, // CLI detection timeout
        action: mainConfig.timeouts?.actionExecution || 30000, // Shared from main
        testing: 10000, // Jest/testing timeout
      },
    },

    // 🔗 SHARED: Memory configuration from main
    memory: {
      maxUsage: mainConfig.memory?.maxUsage || 50000000,
      conversionUnit: 1024, // Technical setting for byte conversions
    },

    // 🔗 SHARED: Retry configuration from main
    retries: {
      attempts: mainConfig.retries?.attempts || 3,
      delay: mainConfig.retries?.delay || 1000,
      api: {
        commerce: {
          attempts: mainConfig.retries?.attempts || 3,
          delay: mainConfig.retries?.delay || 1000,
        },
        mesh: {
          attempts: mainConfig.retries?.attempts || 3,
          delay: mainConfig.retries?.delay || 1000,
        },
      },
    },

    // 🔧 TECHNICAL: Performance-specific batching settings
    batching: {
      requestDelay: 75, // Technical: delay between batches
      maxConcurrent: mainConfig.batching?.maxConcurrent || 15, // Shared from main
      bulkInventoryThreshold: 25, // Technical: SKUs per bulk request
    },

    // 🔗 SHARED: Cache configuration from main
    caching: {
      categories: {
        meshTtl: mainConfig.cache?.categoriesTtl || 300000, // 5 minutes (mesh operations)
        fileTimeout: mainConfig.cache?.categoriesFileTimeout || 1800, // 30 minutes (file operations)
      },
    },

    // 🔧 TECHNICAL: Performance optimization flags
    optimization: {
      parallelProcessing: true, // Technical: enable parallel processing
      preAllocateArrays: true, // Technical: performance optimization
    },

    // 🔧 TECHNICAL: Tracing and monitoring settings
    tracing: {
      enabled: true,
      errorVerbosity: 'summary', // summary, detailed, minimal
      performance: {
        enabled: true,
        includeMemory: true,
        includeTimings: true,
      },
      timestampPrecision: 1000, // Technical: For timestamp calculations
    },
  };
}

module.exports = {
  buildPerformanceConfig,
};
