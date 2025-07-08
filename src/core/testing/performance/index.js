/**
 * Performance testing framework main entry point
 * Provides unified interface for all performance testing operations
 * @module core/testing/performance
 */

const { createPerformanceTester } = require('./operations/test-orchestration');

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
      // Comparative test results
      return {
        passed: results.comparison.withinTolerance,
        type: 'comparative',
        results: results.individual,
        comparison: results.comparison,
        scenario: scenario.name,
      };
    }

    if (results.optimal) {
      // Batch optimization results
      return {
        passed: true,
        type: 'optimization',
        optimal: results.optimal,
        variants: results.variants,
        analysis: results.analysis,
        scenario: scenario.name,
      };
    }

    // Standard test results
    const metrics = results.deployed?.[0] || results.local?.[0];

    // Check if test actually succeeded (has execution time and no error)
    const testSucceeded = metrics && metrics.executionTime > 0 && !metrics.error;

    let metricsValidation = true;
    if (scenario.expectedMetrics) {
      metricsValidation = Object.entries(scenario.expectedMetrics).every(([key, expected]) => {
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
