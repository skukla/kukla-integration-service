/**
 * Test orchestration operations for performance testing
 * Contains test scenario orchestration and performance tester factory
 * @module core/testing/performance/operations/test-orchestration
 */

const path = require('path');

const createBaselineManager = require('../baseline-manager');
const { executeLocalTest, executeDeployedTest } = require('./test-execution');
const { runComparativeTest, runBatchOptimization } = require('./test-types');

/**
 * Runs a test scenario with baseline management
 * @param {Object} scenario Test scenario
 * @param {Object} config Configuration object
 * @param {Object} baselineManager Baseline manager instance
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function runTestScenario(scenario, config, baselineManager, onProgress = () => {}) {
  // Handle different scenario types
  if (scenario.actions && scenario.actions.length > 1) {
    // Comparative testing
    return await runComparativeTest(scenario.actions, scenario, config, onProgress);
  }

  if (scenario.variants && scenario.variants.length > 0) {
    // Batch optimization testing
    return await runBatchOptimization(scenario, config, onProgress);
  }

  // Standard single-action testing
  const results = {
    local: [],
    deployed: [],
  };

  // Check if we need to establish new baselines
  if (['local', 'both'].includes(config.environment)) {
    const { needsBaseline } = baselineManager.checkBaseline(scenario.name, 'local');

    for (let i = 0; i < config.iterations; i++) {
      const metrics = await executeLocalTest(scenario, config, onProgress);
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

/**
 * Creates a performance tester instance
 * @param {Object} config - Configuration object
 * @param {Object} options - Configuration options
 * @returns {Object} Performance tester functions
 */
function createPerformanceTester(config, options = {}) {
  const testConfig = {
    environment: options.environment || 'local',
    iterations: options.iterations || 1,
    format: options.format || 'json',
    baselineFile: options.baselineFile || path.join(process.cwd(), 'config/baseline-metrics.json'),
    commerceUrl: process.env.COMMERCE_BASE_URL,
    includeAnalysis: options.includeAnalysis || false,
  };

  const baselineManager = createBaselineManager(config, {
    baselineFile: testConfig.baselineFile,
  });

  return {
    runTest: (scenario, onProgress) =>
      runTestScenario(scenario, testConfig, baselineManager, onProgress),
    executeLocalTest: (scenario, onProgress) => executeLocalTest(scenario, testConfig, onProgress),
    executeDeployedTest: (scenario, onProgress) => executeDeployedTest(scenario, onProgress),
    runComparativeTest: (actions, scenario, onProgress) =>
      runComparativeTest(actions, scenario, testConfig, onProgress),
    runBatchOptimization: (scenario, onProgress) =>
      runBatchOptimization(scenario, testConfig, onProgress),
  };
}

module.exports = {
  runTestScenario,
  createPerformanceTester,
};
