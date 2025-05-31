const path = require('path');

const createApiTester = require('./api-tester');
const createBaselineManager = require('./baseline-manager');
const { main } = require('../../../actions/backend/get-products');
const { PerformanceMetrics } = require('../../../actions/core/performance');

/**
 * Creates a performance tester instance
 * @param {Object} options Configuration options
 * @returns {Object} Performance tester functions
 */
function createPerformanceTester(options = {}) {
  const config = {
    environment: options.environment || 'local',
    iterations: options.iterations || 1,
    format: options.format || 'json',
    baselineFile: options.baselineFile || path.join(process.cwd(), 'config/baseline-metrics.json'),
  };

  const baselineManager = createBaselineManager({
    baselineFile: config.baselineFile,
  });

  /**
   * Executes a local test
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function executeLocalTest(scenario, onProgress) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const rawParams = {
      __ow_query: { env: 'dev' },
      ...scenario.params,
      LOG_LEVEL: 'info',
      COMMERCE_URL: process.env.COMMERCE_URL,
      COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
    };

    const metrics = new PerformanceMetrics();
    await metrics.start();

    try {
      if (onProgress) await onProgress('Running local test...');
      await main(rawParams);
    } finally {
      await metrics.stop();
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      executionTime: endTime - startTime,
      memory: endMemory - startMemory,
      ...metrics.getMetrics(),
    };
  }

  /**
   * Executes a deployed test
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function executeDeployedTest(scenario, onProgress) {
    const apiConfig = {
      deployed: {
        baseUrl: process.env.API_BASE_URL,
        auth: {
          commerceUrl: process.env.COMMERCE_URL,
          commerceAdminUsername: process.env.COMMERCE_ADMIN_USERNAME,
          commerceAdminPassword: process.env.COMMERCE_ADMIN_PASSWORD,
        },
      },
    };

    const apiTester = createApiTester(apiConfig.deployed);
    const result = await apiTester.testProducts(scenario.params, onProgress);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.metrics;
  }

  /**
   * Runs a test scenario
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function runTest(scenario, onProgress = () => {}) {
    const results = {
      local: [],
      deployed: [],
    };

    // Check if we need to establish new baselines
    if (['local', 'both'].includes(config.environment)) {
      const { needsBaseline } = baselineManager.checkBaseline(scenario.name, 'local');

      for (let i = 0; i < config.iterations; i++) {
        const metrics = await executeLocalTest(scenario, onProgress);
        results.local.push(metrics);

        // Save as baseline if needed and this is the first iteration
        if (needsBaseline && i === 0) {
          baselineManager.saveBaseline(scenario.name, metrics, 'local');
        } else if (i === 0) {
          // Compare with existing baseline
          baselineManager.compareWithBaseline(scenario.name, metrics, 'local');
        }
      }
    }

    if (['deployed', 'both'].includes(config.environment)) {
      const { needsBaseline } = baselineManager.checkBaseline(scenario.name, 'deployed');

      for (let i = 0; i < config.iterations; i++) {
        const metrics = await executeDeployedTest(scenario, onProgress);
        results.deployed.push(metrics);

        // Save as baseline if needed and this is the first iteration
        if (needsBaseline && i === 0) {
          baselineManager.saveBaseline(scenario.name, metrics, 'deployed');
        } else if (i === 0) {
          // Compare with existing baseline
          baselineManager.compareWithBaseline(scenario.name, metrics, 'deployed');
        }
      }
    }

    return results;
  }

  return {
    runTest,
    executeLocalTest,
    executeDeployedTest,
  };
}

module.exports = {
  createPerformanceTester,
};
