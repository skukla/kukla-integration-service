/**
 * Result Aggregation - Performance Metrics Sub-module
 * Performance analysis, scoring, and distribution calculation utilities
 */

/**
 * Calculate performance-specific metrics from test results
 * @purpose Extract and analyze performance data from test results
 * @param {Array} results - Array of individual test results
 * @returns {Object} Performance metrics and analysis
 * @usedBy aggregateTestResults
 */
function calculatePerformanceMetrics(results) {
  const performanceTests = results.filter((r) => r.type === 'performance');

  if (performanceTests.length === 0) {
    return {
      averageScore: 0,
      bestPerformer: null,
      worstPerformer: null,
      performanceDistribution: null,
    };
  }

  // Extract performance scores
  const scores = performanceTests
    .filter((t) => t.result?.score !== undefined)
    .map((t) => ({ target: t.target, score: t.result.score }));

  if (scores.length === 0) {
    return {
      averageScore: 0,
      bestPerformer: null,
      worstPerformer: null,
      performanceDistribution: null,
    };
  }

  const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const bestPerformer = scores.reduce((best, current) =>
    current.score > best.score ? current : best
  );
  const worstPerformer = scores.reduce((worst, current) =>
    current.score < worst.score ? current : worst
  );

  return {
    averageScore: Math.round(averageScore),
    bestPerformer,
    worstPerformer,
    performanceDistribution: calculatePerformanceDistribution(scores),
  };
}

/**
 * Calculate performance score distribution
 * @purpose Analyze distribution of performance scores
 * @param {Array} scores - Array of performance scores
 * @returns {Object} Performance distribution statistics
 * @usedBy calculatePerformanceMetrics
 */
function calculatePerformanceDistribution(scores) {
  const scoreValues = scores.map((s) => s.score);
  const excellent = scoreValues.filter((s) => s >= 90).length;
  const good = scoreValues.filter((s) => s >= 70 && s < 90).length;
  const fair = scoreValues.filter((s) => s >= 50 && s < 70).length;
  const poor = scoreValues.filter((s) => s < 50).length;

  return {
    excellent,
    good,
    fair,
    poor,
    total: scoreValues.length,
  };
}

module.exports = {
  calculatePerformanceMetrics,
  calculatePerformanceDistribution,
};
