/**
 * Result Aggregation - Timing Metrics Sub-module
 * Timing analysis, distribution calculation, and performance scoring utilities
 */

// Timing Analysis Workflows

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
    timingDistribution: calculateTimingDistribution(executionTimes),
  };
}

// Timing Analysis Utilities

/**
 * Calculate timing distribution statistics
 * @purpose Provide distribution analysis of test execution times
 * @param {Array} executionTimes - Array of execution times
 * @returns {Object} Timing distribution statistics
 * @usedBy calculateTimingMetrics
 */
function calculateTimingDistribution(executionTimes) {
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const length = sortedTimes.length;

  const median =
    length % 2 === 0
      ? (sortedTimes[length / 2 - 1] + sortedTimes[length / 2]) / 2
      : sortedTimes[Math.floor(length / 2)];

  const p90Index = Math.floor(length * 0.9);
  const p90 = sortedTimes[p90Index] || sortedTimes[length - 1];

  return {
    median: Math.round(median),
    p90: Math.round(p90),
    range: sortedTimes[length - 1] - sortedTimes[0],
  };
}

/**
 * Calculate timing score based on average execution time
 * @purpose Convert execution time to a 0-100 score
 * @param {number} averageTime - Average execution time in milliseconds
 * @returns {number} Timing score from 0-100
 * @usedBy calculateOverallGrade
 */
function calculateTimingScore(averageTime) {
  // Timing score thresholds
  if (averageTime <= 2000) return 100; // Excellent
  if (averageTime <= 5000) return 80; // Good
  if (averageTime <= 10000) return 60; // Fair
  if (averageTime <= 20000) return 40; // Poor
  return 20; // Very poor
}

module.exports = {
  calculateTimingMetrics,
  calculateTimingDistribution,
  calculateTimingScore,
};
