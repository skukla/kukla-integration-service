/**
 * Baseline Comparison - Baseline Management Sub-module
 * Baseline loading, updating, and management utilities
 */

// Workflows

/**
 * Load baseline metrics from configuration
 * @purpose Load existing baseline metrics for comparison
 * @param {string} testTarget - Target being tested
 * @param {Object} config - Configuration with baseline data
 * @returns {Object} Baseline metrics or null if not found
 * @usedBy compareAgainstBaseline for retrieving baseline data
 */
function loadBaselineMetrics(testTarget, config) {
  if (!config || !config.performance || !config.performance.baselines) {
    return null;
  }

  const baseline = config.performance.baselines[testTarget];
  if (!baseline) {
    return null;
  }

  return {
    responseTime: baseline.responseTime || 0,
    p95Time: baseline.p95Time || 0,
    maxTime: baseline.maxTime || 0,
    timestamp: baseline.timestamp || new Date().toISOString(),
    version: baseline.version || '1.0.0',
  };
}

/**
 * Update baseline metrics with new performance data
 * @purpose Update baseline metrics when performance improves or targets change
 * @param {string} testTarget - Target being tested
 * @param {Object} newMetrics - New performance metrics
 * @param {Object} config - Configuration to update
 * @returns {Object} Updated baseline configuration
 * @usedBy Baseline management workflows
 */
function updateBaselineMetrics(testTarget, newMetrics, config) {
  if (!config.performance) {
    config.performance = {};
  }
  if (!config.performance.baselines) {
    config.performance.baselines = {};
  }

  config.performance.baselines[testTarget] = {
    responseTime: newMetrics.responseTime,
    p95Time: newMetrics.p95Time,
    maxTime: newMetrics.maxTime,
    timestamp: new Date().toISOString(),
    version: newMetrics.version || '1.0.0',
  };

  return config;
}

/**
 * Compare current metrics against baseline
 * @purpose Perform comprehensive comparison between current and baseline metrics
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baselineMetrics - Baseline performance metrics
 * @returns {Object} Detailed comparison result
 * @usedBy comparePerformanceMetrics for baseline validation
 */
function compareAgainstBaseline(currentMetrics, baselineMetrics) {
  if (!baselineMetrics) {
    return {
      hasBaseline: false,
      comparison: null,
      recommendations: ['No baseline data available - consider establishing baseline metrics'],
    };
  }

  const comparison = {
    responseTime: calculatePercentageChange(
      baselineMetrics.responseTime,
      currentMetrics.responseTime
    ),
    p95Time: calculatePercentageChange(baselineMetrics.p95Time, currentMetrics.p95Time),
    maxTime: calculatePercentageChange(baselineMetrics.maxTime, currentMetrics.maxTime),
  };

  const trend = determinePerformanceTrend(comparison);
  const recommendations = generatePerformanceRecommendations(comparison, trend);

  return {
    hasBaseline: true,
    baseline: baselineMetrics,
    current: currentMetrics,
    comparison,
    trend,
    recommendations,
  };
}

// Utilities

/**
 * Calculate percentage change between baseline and current value
 * @purpose Calculate the percentage difference for performance metrics
 * @param {number} baseline - Baseline value
 * @param {number} current - Current value
 * @returns {Object} Change calculation with percentage and direction
 * @usedBy compareAgainstBaseline
 */
function calculatePercentageChange(baseline, current) {
  if (!baseline || baseline === 0) {
    return { percentage: 0, direction: 'unknown', rawChange: current };
  }

  const change = current - baseline;
  const percentage = Math.abs((change / baseline) * 100);
  const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'unchanged';

  return {
    percentage: Math.round(percentage * 100) / 100,
    direction,
    rawChange: change,
    baseline,
    current,
  };
}

/**
 * Determine overall performance trend
 * @purpose Analyze comparison results to determine performance trend
 * @param {Object} comparison - Comparison results object
 * @returns {string} Performance trend (improved, degraded, mixed, stable)
 * @usedBy compareAgainstBaseline
 */
function determinePerformanceTrend(comparison) {
  const metrics = [comparison.responseTime, comparison.p95Time, comparison.maxTime];
  const improved = metrics.filter((m) => m.direction === 'decreased').length;
  const degraded = metrics.filter((m) => m.direction === 'increased').length;

  if (improved > degraded) return 'improved';
  if (degraded > improved) return 'degraded';
  if (improved === 0 && degraded === 0) return 'stable';
  return 'mixed';
}

/**
 * Generate performance recommendations based on comparison
 * @purpose Provide actionable recommendations based on performance trends
 * @param {Object} comparison - Performance comparison results
 * @param {string} trend - Overall performance trend
 * @returns {Array} Array of recommendation strings
 * @usedBy compareAgainstBaseline
 */
function generatePerformanceRecommendations(comparison, trend) {
  const recommendations = [];

  switch (trend) {
    case 'degraded':
      recommendations.push('Performance has degraded - investigate recent changes');
      if (comparison.responseTime.percentage > 20) {
        recommendations.push('Response time increased significantly - check server resources');
      }
      break;
    case 'improved':
      recommendations.push('Performance has improved - consider updating baseline metrics');
      break;
    case 'mixed':
      recommendations.push('Mixed performance results - review individual metrics');
      break;
    case 'stable':
      recommendations.push('Performance is stable and within expected ranges');
      break;
  }

  return recommendations;
}

module.exports = {
  // Workflows
  loadBaselineMetrics,
  updateBaselineMetrics,
  compareAgainstBaseline,

  // Utilities
  calculatePercentageChange,
  determinePerformanceTrend,
  generatePerformanceRecommendations,
};
