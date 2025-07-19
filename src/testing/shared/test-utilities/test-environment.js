/**
 * Test Utilities - Test Environment Sub-module
 * Environment configuration, setup, and teardown utilities
 */

/**
 * Build test environment configuration
 * @purpose Create standardized test environment configuration
 * @param {boolean} isProd - Whether to use production environment
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Test environment configuration
 * @usedBy All testing features for environment setup
 */
function buildTestEnvironmentConfig(isProd = false, overrides = {}) {
  const baseConfig = {
    environment: isProd ? 'production' : 'staging',
    timeout: isProd ? 15000 : 10000,
    retries: isProd ? 2 : 1,
    verbose: !isProd,
    endpoints: {
      runtime: isProd ? 'https://prod-runtime.com' : 'https://stage-runtime.com',
      commerce: isProd ? 'https://prod-commerce.com' : 'https://stage-commerce.com',
    },
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Set up test environment
 * @purpose Initialize test environment with proper configuration and cleanup
 * @param {Object} config - Test environment configuration
 * @returns {Promise<Object>} Environment setup result
 * @usedBy Test orchestration for environment preparation
 */
async function setupTestEnvironment(config) {
  const environment = {
    startTime: Date.now(),
    config,
    cleanup: [],
  };

  // Set up environment variables
  if (config.environment === 'staging') {
    process.env.TEST_MODE = 'staging';
  }

  // Set timeout handlers
  if (config.timeout) {
    environment.timeoutHandler = setTimeout(() => {
      console.warn(`Test environment timeout after ${config.timeout}ms`);
    }, config.timeout);
    environment.cleanup.push(() => clearTimeout(environment.timeoutHandler));
  }

  return environment;
}

/**
 * Clean up test environment
 * @purpose Clean up test environment resources and reset state
 * @param {Object} environment - Environment object from setupTestEnvironment
 * @returns {Promise<void>} Cleanup completion
 * @usedBy Test orchestration for environment cleanup
 */
async function cleanupTestEnvironment(environment) {
  if (!environment || !environment.cleanup) {
    return;
  }

  // Execute all cleanup functions
  for (const cleanupFn of environment.cleanup) {
    try {
      await cleanupFn();
    } catch (error) {
      console.warn(`Cleanup error: ${error.message}`);
    }
  }

  // Reset environment variables
  delete process.env.TEST_MODE;

  // Log cleanup completion
  const duration = Date.now() - environment.startTime;
  console.log(`Test environment cleaned up after ${duration}ms`);
}

module.exports = {
  buildTestEnvironmentConfig,
  setupTestEnvironment,
  cleanupTestEnvironment,
};
