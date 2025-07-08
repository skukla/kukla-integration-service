/**
 * Performance testing framework main entry point
 * Provides unified interface for all performance testing operations
 * @module core/testing/performance
 */

const { createPerformanceTester } = require('./operations/test-orchestration');

/**
 * Process comparative test results
 * @param {Object} results - Raw test results
 * @param {string} scenarioName - Scenario name
 * @returns {Object} Processed comparative results
 */
function processComparativeResults(results, scenarioName) {
  return {
    passed: results.comparison.withinTolerance,
    type: 'comparative',
    results: results.individual,
    comparison: results.comparison,
    scenario: scenarioName,
  };
}

/**
 * Process optimization test results
 * @param {Object} results - Raw test results
 * @param {string} scenarioName - Scenario name
 * @returns {Object} Processed optimization results
 */
function processOptimizationResults(results, scenarioName) {
  return {
    passed: true,
    type: 'optimization',
    optimal: results.optimal,
    variants: results.variants,
    analysis: results.analysis,
    scenario: scenarioName,
  };
}

/**
 * Validate metrics against expected values
 * @param {Object} metrics - Performance metrics
 * @param {Object} expectedMetrics - Expected metric values
 * @returns {boolean} Whether metrics pass validation
 */
function validateMetricsAgainstExpected(metrics, expectedMetrics) {
  if (!expectedMetrics) return true;

  return Object.entries(expectedMetrics).every(([key, expected]) => {
    // Map expected metric names to actual metric keys
    let actualKey = key;
    if (key === 'maxExecutionTime') actualKey = 'executionTime';
    if (key === 'maxMemory') actualKey = 'memory';
    if (key === 'maxMemoryUsage') actualKey = 'memory';
    if (key === 'minProductCount') actualKey = 'productCount';
    if (key === 'maxApiCalls') actualKey = 'apiCalls';

    const actual = metrics[actualKey];
    let passes = true;

    if (key.startsWith('max')) {
      passes = actual <= expected;
    } else if (key.startsWith('min')) {
      passes = actual >= expected;
    }

    return passes;
  });
}

/**
 * Process standard test results
 * @param {Object} results - Raw test results
 * @param {Object} scenario - Test scenario
 * @returns {Object} Processed standard results
 */
function processStandardResults(results, scenario) {
  const metrics = results.deployed?.[0] || results.local?.[0];

  // Check if test actually succeeded (has execution time and no error)
  const testSucceeded = metrics && metrics.executionTime > 0 && !metrics.error;
  const metricsValidation = validateMetricsAgainstExpected(metrics, scenario.expectedMetrics);
  const passed = testSucceeded && metricsValidation;

  return {
    passed,
    type: 'standard',
    metrics,
    scenario: scenario.name,
    analysis: metrics?.analysis,
    recommendations: metrics?.recommendations,
    error: !testSucceeded ? metrics?.error || 'Test execution failed' : undefined,
  };
}

/**
 * Test a scenario with thresholds and baseline comparison
 * @param {Object} config - Configuration object
 * @param {Object} scenario - Test scenario
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test results
 */
async function testScenario(config, scenario, options = {}) {
  const tester = createPerformanceTester(config, {
    environment: options.environment || 'local',
    iterations: options.iterations || 1,
    includeAnalysis: scenario.analysis || options.includeAnalysis,
  });

  try {
    const results = await tester.runTest(scenario);

    // Handle different result types
    if (results.comparison) {
      return processComparativeResults(results, scenario.name);
    }

    if (results.optimal) {
      return processOptimizationResults(results, scenario.name);
    }

    return processStandardResults(results, scenario);
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      scenario: scenario.name,
    };
  }
}

// Re-export all operations for backward compatibility
module.exports = {
  // Main public interface
  testScenario,
  createPerformanceTester,

  // Re-export all operations for backward compatibility
  ...require('./operations/test-execution'),
  ...require('./operations/test-types'),
  ...require('./operations/test-orchestration'),
};
