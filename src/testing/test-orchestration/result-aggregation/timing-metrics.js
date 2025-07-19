/**
 * Result Aggregation - Timing Metrics Sub-module
 * Timing analysis, distribution calculation, and performance scoring utilities
 */

// Workflows

/**
 * Calculate comprehensive timing metrics from test results
 * @purpose Analyze timing patterns across all test results
 * @param {Array} results - Array of individual test results
 * @returns {Object} Timing metrics including averages, min/max, and distribution
 * @usedBy aggregateTestResults
 */
function calculateTimingMetrics(results) {
  const executionTimes = results
    .filter((r) => r.executionTime && r.executionTime > 0)
    .map((r) => r.executionTime);

  if (executionTimes.length === 0) {
    return { averageTime: 0, totalTime: 0, fastestTest: 0, slowestTest: 0 };
  }

  const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / executionTimes.length;
  const fastestTest = Math.min(...executionTimes);
  const slowestTest = Math.max(...executionTimes);

  return {
    averageTime: Math.round(averageTime),
    totalTime,
    fastestTest,
    slowestTest,
    distribution: calculateTimingDistribution(executionTimes),
  };
}

/**
 * Calculate timing distribution analysis
 * @purpose Analyze timing distribution patterns and performance consistency
 * @param {Array} executionTimes - Array of execution times in milliseconds
 * @returns {Object} Distribution analysis with percentiles and variance
 * @usedBy calculateTimingMetrics
 */
function calculateTimingDistribution(executionTimes) {
  if (executionTimes.length === 0) {
    return { p50: 0, p95: 0, p99: 0, variance: 0 };
  }

  const sorted = [...executionTimes].sort((a, b) => a - b);
  const length = sorted.length;

  return {
    p50: sorted[Math.floor(length * 0.5)],
    p95: sorted[Math.floor(length * 0.95)],
    p99: sorted[Math.floor(length * 0.99)],
    variance: calculateVariance(executionTimes),
  };
}

// Utilities

/**
 * Calculate timing score based on performance metrics
 * @purpose Generate performance score from timing metrics for grading
 * @param {Object} timingMetrics - Timing metrics object
 * @returns {number} Performance score from 0-100
 * @usedBy calculateOverallGrade
 */
function calculateTimingScore(timingMetrics) {
  if (!timingMetrics.averageTime) return 100;

  // Score based on average execution time
  // Under 1s = 100, under 5s = 80, under 10s = 60, under 30s = 40, over 30s = 20
  if (timingMetrics.averageTime < 1000) return 100;
  if (timingMetrics.averageTime < 5000) return 80;
  if (timingMetrics.averageTime < 10000) return 60;
  if (timingMetrics.averageTime < 30000) return 40;
  return 20;
}

/**
 * Calculate variance in execution times
 * @purpose Calculate statistical variance for timing consistency analysis
 * @param {Array} times - Array of execution times
 * @returns {number} Variance value
 * @usedBy calculateTimingDistribution
 */
function calculateVariance(times) {
  if (times.length === 0) return 0;

  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  const squaredDiffs = times.map((time) => Math.pow(time - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / times.length;
}

module.exports = {
  calculateTimingMetrics,
  calculateTimingDistribution,
  calculateTimingScore,
  calculateVariance,
};
