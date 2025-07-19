/**
 * Performance Testing - Baseline Comparison Sub-module
 * All performance test results analysis utilities including baseline comparison, threshold validation, and trend analysis
 */

// Performance Results Analysis

/**
 * Analyze performance test results comprehensively
 * @purpose Perform complete analysis of performance test results including baseline comparison and validation
 * @param {Object} testResult - Raw performance test execution results
 * @param {Object} scenario - Test scenario configuration
 * @param {Object} config - Application configuration with performance expectations
 * @returns {Object} Complete performance analysis with metrics, validation, and recommendations
 * @usedBy executePerformanceTestWorkflow
 */
function analyzePerformanceTestResults(testResult, scenario, config) {
  const { calculatePerformanceMetrics } = require('./metrics-collection');

  // Step 1: Calculate performance metrics from test results
  const metrics = calculatePerformanceMetrics(testResult.testResults);

  // Step 2: Validate against expectations and thresholds
  const validation = validatePerformanceExpectations(metrics, scenario, config);

  // Step 3: Compare against baseline if available
  const baselineComparison = compareAgainstBaseline(metrics, testResult.target);

  // Step 4: Generate recommendations and insights
  const recommendations = generatePerformanceRecommendations(
    metrics,
    validation,
    baselineComparison
  );

  return {
    metrics,
    validation,
    baselineComparison,
    recommendations,
    summary: generatePerformanceSummary(metrics, validation),
    analysisTimestamp: new Date().toISOString(),
  };
}

// Performance Validation

/**
 * Validate performance results against expectations and thresholds
 * @purpose Check if performance metrics meet defined expectations and quality thresholds
 * @param {Object} metrics - Calculated performance metrics
 * @param {Object} scenario - Test scenario configuration
 * @param {Object} config - Application configuration
 * @returns {Object} Validation result with pass/fail status and detailed checks
 * @usedBy analyzePerformanceTestResults
 */
function validatePerformanceExpectations(metrics, scenario, config) {
  const checks = [];

  // Perform all validation checks
  performSuccessRateValidation(metrics, config, checks);
  performResponseTimeValidation(metrics, scenario, checks);
  performP95TimeValidation(metrics, scenario, checks);
  performConsistencyValidation(metrics, config, checks);
  performMaxTimeValidation(metrics, scenario, checks);

  // Calculate overall result
  const checksPassed = checks.filter((c) => c.pass).length;
  const checksFailed = checks.filter((c) => c.pass === false).length;
  const overallPass =
    checks.filter((c) => c.pass === false && c.severity === 'critical').length === 0;

  return {
    overallPass,
    checksPerformed: checks.length,
    checksPassed,
    checksFailed,
    checks,
    grade: metrics.performanceGrade,
  };
}

/**
 * Perform success rate validation check
 * @purpose Validate that success rate meets minimum requirements
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Application configuration
 * @param {Array} checks - Array to collect validation checks
 * @usedBy validatePerformanceExpectations
 */
function performSuccessRateValidation(metrics, config, checks) {
  const minSuccessRate = config.testing?.expectations?.minSuccessRate || 95;
  checks.push({
    name: 'Success Rate',
    expected: `≥${minSuccessRate}%`,
    actual: `${metrics.successRate.toFixed(1)}%`,
    pass: metrics.successRate >= minSuccessRate,
    severity: 'critical',
  });
}

/**
 * Perform average response time validation check
 * @purpose Validate that average response time meets expectations
 * @param {Object} metrics - Performance metrics
 * @param {Object} scenario - Test scenario configuration
 * @param {Array} checks - Array to collect validation checks
 * @usedBy validatePerformanceExpectations
 */
function performResponseTimeValidation(metrics, scenario, checks) {
  const maxAvgResponseTime = scenario.expectedResponseTime || 2000;
  checks.push({
    name: 'Average Response Time',
    expected: `≤${maxAvgResponseTime}ms`,
    actual: `${Math.round(metrics.averageTime)}ms`,
    pass: metrics.averageTime <= maxAvgResponseTime,
    severity: 'high',
  });
}

/**
 * Perform P95 response time validation check
 * @purpose Validate that P95 response time is within acceptable limits
 * @param {Object} metrics - Performance metrics
 * @param {Object} scenario - Test scenario configuration
 * @param {Array} checks - Array to collect validation checks
 * @usedBy validatePerformanceExpectations
 */
function performP95TimeValidation(metrics, scenario, checks) {
  const maxP95ResponseTime = (scenario.expectedResponseTime || 2000) * 1.5;
  checks.push({
    name: 'P95 Response Time',
    expected: `≤${maxP95ResponseTime}ms`,
    actual: `${Math.round(metrics.p95)}ms`,
    pass: metrics.p95 <= maxP95ResponseTime,
    severity: 'medium',
  });
}

/**
 * Perform consistency validation check
 * @purpose Validate that performance consistency meets requirements
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Application configuration
 * @param {Array} checks - Array to collect validation checks
 * @usedBy validatePerformanceExpectations
 */
function performConsistencyValidation(metrics, config, checks) {
  const minConsistency = config.testing?.expectations?.minConsistency || 70;
  checks.push({
    name: 'Performance Consistency',
    expected: `≥${minConsistency}/100`,
    actual: `${metrics.consistency}/100`,
    pass: metrics.consistency >= minConsistency,
    severity: 'medium',
  });
}

/**
 * Perform maximum response time validation check
 * @purpose Validate that maximum response time is within limits
 * @param {Object} metrics - Performance metrics
 * @param {Object} scenario - Test scenario configuration
 * @param {Array} checks - Array to collect validation checks
 * @usedBy validatePerformanceExpectations
 */
function performMaxTimeValidation(metrics, scenario, checks) {
  const maxResponseTime = scenario.maxExecutionTime || 5000;
  checks.push({
    name: 'Maximum Response Time',
    expected: `≤${maxResponseTime}ms`,
    actual: `${Math.round(metrics.maxTime)}ms`,
    pass: metrics.maxTime <= maxResponseTime,
    severity: 'high',
  });
}

// Baseline Comparison

/**
 * Compare current performance metrics against historical baseline
 * @purpose Analyze performance trends and detect regressions or improvements
 * @param {Object} metrics - Current performance metrics
 * @param {string} target - Target being tested
 * @returns {Object} Baseline comparison result with trend analysis
 * @usedBy analyzePerformanceTestResults
 */
function compareAgainstBaseline(metrics, target) {
  // Load baseline data (in real implementation, this would come from storage)
  const baseline = loadBaselineMetrics(target);

  if (!baseline) {
    return {
      hasBaseline: false,
      message: 'No baseline data available for comparison',
      recommendation: 'Consider running baseline tests to establish performance benchmarks',
    };
  }

  // Calculate percentage changes
  const comparisons = {
    averageTime: calculatePercentageChange(baseline.averageTime, metrics.averageTime),
    p95Time: calculatePercentageChange(baseline.p95, metrics.p95),
    successRate: calculatePercentageChange(baseline.successRate, metrics.successRate),
    consistency: calculatePercentageChange(baseline.consistency, metrics.consistency),
    throughput: calculatePercentageChange(baseline.throughput, metrics.throughput),
  };

  // Determine overall trend
  const trend = determinePerformanceTrend(comparisons);

  return {
    hasBaseline: true,
    baselineDate: baseline.timestamp,
    comparisons,
    trend,
    summary: generateBaselineComparisonSummary(comparisons, trend),
  };
}

/**
 * Load baseline performance metrics for target
 * @purpose Retrieve historical performance data for comparison
 * @param {string} target - Target being tested
 * @returns {Object|null} Baseline metrics or null if not available
 * @usedBy compareAgainstBaseline
 */
function loadBaselineMetrics(target) {
  // In a real implementation, this would load from persistent storage
  // For testing purposes, return mock baseline data
  const mockBaselines = {
    'get-products': {
      averageTime: 850,
      p95: 1200,
      successRate: 98.5,
      consistency: 82,
      throughput: 15.2,
      timestamp: '2024-01-01T00:00:00.000Z',
    },
    'get-products-mesh': {
      averageTime: 1100,
      p95: 1500,
      successRate: 96.8,
      consistency: 78,
      throughput: 12.8,
      timestamp: '2024-01-01T00:00:00.000Z',
    },
  };

  return mockBaselines[target] || null;
}

// Utility Functions

/**
 * Calculate percentage change between baseline and current value
 * @purpose Determine the percentage difference for trend analysis
 * @param {number} baseline - Baseline value
 * @param {number} current - Current value
 * @returns {Object} Percentage change with direction and magnitude
 * @usedBy compareAgainstBaseline
 */
function calculatePercentageChange(baseline, current) {
  if (baseline === 0) {
    return { change: 0, direction: 'none', magnitude: 'none' };
  }

  const changePercent = ((current - baseline) / baseline) * 100;
  const direction = changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'same';

  let magnitude = 'minimal';
  const absChange = Math.abs(changePercent);
  if (absChange >= 20) magnitude = 'major';
  else if (absChange >= 10) magnitude = 'moderate';
  else if (absChange >= 5) magnitude = 'minor';

  return {
    change: Math.round(changePercent * 10) / 10,
    direction,
    magnitude,
    rawValue: current,
    baselineValue: baseline,
  };
}

/**
 * Determine overall performance trend from comparisons
 * @purpose Analyze multiple metrics to determine overall performance direction
 * @param {Object} comparisons - Individual metric comparisons
 * @returns {Object} Overall trend analysis
 * @usedBy compareAgainstBaseline
 */
function determinePerformanceTrend(comparisons) {
  // Weight different metrics by importance
  const weights = {
    averageTime: 0.3,
    p95Time: 0.3,
    successRate: 0.25,
    consistency: 0.1,
    throughput: 0.05,
  };

  let weightedScore = 0;
  Object.entries(comparisons).forEach(([metric, comparison]) => {
    const weight = weights[metric] || 0;
    let score = 0;

    // For time-based metrics, decrease is good
    if (metric.includes('Time')) {
      score = comparison.direction === 'decrease' ? comparison.change : -comparison.change;
    } else {
      // For rate/consistency metrics, increase is good
      score = comparison.direction === 'increase' ? comparison.change : -comparison.change;
    }

    weightedScore += score * weight;
  });

  let trend = 'stable';
  if (weightedScore > 5) trend = 'improving';
  else if (weightedScore < -5) trend = 'degrading';

  return {
    overall: trend,
    score: Math.round(weightedScore * 10) / 10,
    confidence: Math.min(100, Math.abs(weightedScore) * 2),
  };
}

// Summary Generation

/**
 * Generate performance summary text
 * @purpose Create human-readable summary of performance results
 * @param {Object} metrics - Performance metrics
 * @param {Object} validation - Validation results
 * @returns {string} Performance summary text
 * @usedBy analyzePerformanceTestResults
 */
function generatePerformanceSummary(metrics, validation) {
  const status = validation.overallPass ? 'PASSED' : 'FAILED';
  const grade = metrics.performanceGrade;
  const avgTime = Math.round(metrics.averageTime);
  const successRate = metrics.successRate.toFixed(1);

  return `${status} | Grade: ${grade} | Avg: ${avgTime}ms | Success: ${successRate}% | Checks: ${validation.checksPassed}/${validation.checksPerformed}`;
}

/**
 * Generate baseline comparison summary
 * @purpose Create readable summary of baseline comparison results
 * @param {Object} comparisons - Baseline comparisons
 * @param {Object} trend - Trend analysis
 * @returns {string} Baseline comparison summary
 * @usedBy compareAgainstBaseline
 */
function generateBaselineComparisonSummary(comparisons, trend) {
  const avgChange = comparisons.averageTime.direction === 'decrease' ? 'improved' : 'degraded';
  const changeAmount = Math.abs(comparisons.averageTime.change);

  return `Performance ${avgChange} by ${changeAmount}% vs baseline. Overall trend: ${trend.overall} (confidence: ${trend.confidence}%)`;
}

// Performance Recommendations

/**
 * Generate performance improvement recommendations
 * @purpose Provide actionable recommendations based on performance analysis
 * @param {Object} metrics - Performance metrics
 * @param {Object} validation - Validation results
 * @param {Object} baselineComparison - Baseline comparison results
 * @returns {Array} Array of recommendation objects
 * @usedBy analyzePerformanceTestResults
 */
function generatePerformanceRecommendations(metrics, validation, baselineComparison) {
  const recommendations = [];

  // Performance-based recommendations
  if (metrics.averageTime > 2000) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Optimize Response Time',
      description: `Average response time of ${Math.round(metrics.averageTime)}ms exceeds optimal threshold`,
      action: 'Consider optimizing slow operations, database queries, or adding caching',
    });
  }

  if (metrics.successRate < 95) {
    recommendations.push({
      type: 'reliability',
      priority: 'critical',
      title: 'Improve Success Rate',
      description: `Success rate of ${metrics.successRate.toFixed(1)}% is below acceptable threshold`,
      action: 'Investigate and fix causes of test failures',
    });
  }

  if (metrics.consistency < 70) {
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Improve Performance Consistency',
      description: `Performance consistency score of ${metrics.consistency} indicates high variability`,
      action: 'Investigate causes of performance variance and optimize for consistent execution',
    });
  }

  // Trend-based recommendations
  if (baselineComparison.hasBaseline && baselineComparison.trend.overall === 'degrading') {
    recommendations.push({
      type: 'regression',
      priority: 'high',
      title: 'Performance Regression Detected',
      description: baselineComparison.summary,
      action: 'Review recent changes and identify performance regressions',
    });
  }

  return recommendations;
}

module.exports = {
  // Performance Results Analysis
  analyzePerformanceTestResults,

  // Performance Validation
  validatePerformanceExpectations,
  performSuccessRateValidation,
  performResponseTimeValidation,
  performP95TimeValidation,
  performConsistencyValidation,
  performMaxTimeValidation,

  // Baseline Comparison
  compareAgainstBaseline,
  loadBaselineMetrics,

  // Utility Functions
  calculatePercentageChange,
  determinePerformanceTrend,

  // Summary Generation
  generatePerformanceSummary,
  generateBaselineComparisonSummary,

  // Performance Recommendations
  generatePerformanceRecommendations,
};
