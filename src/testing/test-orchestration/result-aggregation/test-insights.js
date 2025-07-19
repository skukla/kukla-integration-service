/**
 * Result Aggregation - Test Insights Sub-module
 * Insight generation, recommendation analysis, and test pattern detection utilities
 */

// Workflows

/**
 * Analyze test results by test type
 * @purpose Provide breakdown of results by test type (action, api, performance)
 * @param {Array} results - Array of individual test results
 * @returns {Object} Analysis breakdown by test type
 * @usedBy aggregateTestResults
 */
function analyzeTestTypes(results) {
  const typeGroups = results.reduce((groups, result) => {
    const type = result.type || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {});

  const analysis = {};

  Object.entries(typeGroups).forEach(([type, tests]) => {
    const passed = tests.filter((t) => t.success).length;
    const total = tests.length;
    const successRate = (passed / total) * 100;
    const avgTime = tests.reduce((sum, t) => sum + (t.executionTime || 0), 0) / total;

    analysis[type] = {
      total,
      passed,
      failed: total - passed,
      successRate,
      averageTime: Math.round(avgTime),
    };
  });

  return analysis;
}

// Utilities

/**
 * Generate insights and recommendations from test results
 * @purpose Provide actionable insights based on test execution patterns
 * @param {Array} results - Array of individual test results
 * @param {number} successRate - Overall success rate
 * @param {Object} timingMetrics - Timing analysis results
 * @returns {Array} Array of insight objects with recommendations
 * @usedBy aggregateTestResults
 */
function generateTestInsights(results, successRate, timingMetrics) {
  const insights = [];

  // Success rate insights
  if (successRate < 80) {
    insights.push({
      type: 'reliability',
      severity: 'high',
      message: `Low success rate (${successRate.toFixed(1)}%) indicates reliability issues`,
      recommendation: 'Review failed tests and improve error handling',
    });
  } else if (successRate === 100) {
    insights.push({
      type: 'success',
      severity: 'info',
      message: 'Perfect success rate achieved',
      recommendation: 'Consider adding more comprehensive test coverage',
    });
  }

  // Timing insights
  if (timingMetrics.averageTime > 10000) {
    insights.push({
      type: 'performance',
      severity: 'medium',
      message: `High average execution time (${timingMetrics.averageTime}ms)`,
      recommendation: 'Optimize slow tests or consider parallel execution',
    });
  }

  // Test type insights
  const failedByType = results.reduce((acc, result) => {
    if (!result.success) {
      acc[result.type] = (acc[result.type] || 0) + 1;
    }
    return acc;
  }, {});

  Object.entries(failedByType).forEach(([type, count]) => {
    if (count > 1) {
      insights.push({
        type: 'pattern',
        severity: 'medium',
        message: `Multiple ${type} test failures (${count} tests)`,
        recommendation: `Investigate common issues in ${type} test infrastructure`,
      });
    }
  });

  return insights;
}

module.exports = {
  analyzeTestTypes,
  generateTestInsights,
};
