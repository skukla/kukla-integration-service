/**
 * Test type operations for performance testing
 * Contains specialized test types like comparative and batch optimization
 * @module core/testing/performance/operations/test-types
 */

const { executeLocalTest } = require('./test-execution');

/**
 * Runs a comparative test between multiple actions
 * @param {Array} actions Actions to compare
 * @param {Object} scenario Test scenario
 * @param {Object} config Configuration object
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Comparison results
 */
async function runComparativeTest(actions, scenario, config, onProgress) {
  const results = {};

  for (const action of actions) {
    const actionScenario = { ...scenario, action };

    if (onProgress) await onProgress(`Testing ${action}...`);

    try {
      const result = await executeLocalTest(actionScenario, config, onProgress);
      results[action] = result;
    } catch (error) {
      results[action] = { error: error.message, executionTime: 0 };
    }
  }

  // Calculate comparison metrics
  const [firstAction, secondAction] = actions;
  const first = results[firstAction];
  const second = results[secondAction];

  // Check if both tests succeeded
  if (first.error || second.error || !first.executionTime || !second.executionTime) {
    return {
      individual: results,
      comparison: {
        error: 'One or both tests failed',
        withinTolerance: false,
      },
    };
  }

  const percentDifference =
    ((second.executionTime - first.executionTime) / first.executionTime) * 100;
  const winner = first.executionTime < second.executionTime ? firstAction : secondAction;

  const tolerance = scenario.comparison?.tolerancePercent || 20;
  const withinTolerance = Math.abs(percentDifference) <= tolerance;

  return {
    individual: results,
    comparison: {
      percentDifference: Math.abs(percentDifference),
      fasterAction: winner,
      slowerAction: winner === firstAction ? secondAction : firstAction,
      withinTolerance,
    },
  };
}

/**
 * Runs batch optimization testing
 * @param {Object} scenario Batch testing scenario
 * @param {Object} config Configuration object
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Optimization results
 */
async function runBatchOptimization(scenario, config, onProgress) {
  const results = [];

  for (const variant of scenario.variants) {
    const variantScenario = {
      ...scenario,
      params: { ...scenario.params, ...variant.params },
    };

    if (onProgress) await onProgress(`Testing ${variant.name}...`);

    const result = await executeLocalTest(variantScenario, config, onProgress);
    results.push({
      ...result,
      name: variant.name,
      params: variant.params,
      expectedTime: variant.expectedTime,
      meetsExpectation: variant.expectedTime ? result.executionTime <= variant.expectedTime : true,
    });
  }

  // Find optimal configuration
  const optimal = results.reduce((best, current) =>
    current.executionTime < best.executionTime ? current : best
  );

  return {
    variants: results,
    optimal: {
      name: optimal.name,
      params: optimal.params,
      executionTime: optimal.executionTime,
    },
    analysis: {
      fastestTime: Math.min(...results.map((r) => r.executionTime)),
      slowestTime: Math.max(...results.map((r) => r.executionTime)),
      averageTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
    },
  };
}

module.exports = {
  runComparativeTest,
  runBatchOptimization,
};
