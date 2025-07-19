/**
 * Performance Testing - Baseline Comparison Feature Core
 * Main baseline comparison capability with performance validation and analysis
 */

// Import baseline operations from sub-modules
const {
  loadBaselineMetrics,
  compareAgainstBaseline,
  calculatePercentageChange,
  determinePerformanceTrend,
  generatePerformanceRecommendations,
} = require('./baseline-comparison/baseline-management');

// Performance Results Analysis

/**
 * Analyze performance test results comprehensively
 * @purpose Perform complete analysis of performance test results including baseline comparison and validation
 * @param {Object} testResult - Performance test result to analyze
 * @param {Object} config - Configuration with baseline data and thresholds
 * @returns {Object} Comprehensive performance analysis result
 * @usedBy executePerformanceTestWorkflow for result analysis
 */
async function analyzePerformanceTestResults(testResult, config) {
  const analysis = {
    target: testResult.target,
    timestamp: new Date().toISOString(),
    metrics: testResult.metrics,
    validation: {},
    baseline: {},
    summary: {},
    recommendations: [],
  };

  // Step 1: Perform threshold validation
  analysis.validation = await performPerformanceValidation(testResult.metrics, config);

  // Step 2: Compare against baseline if available
  const baselineMetrics = loadBaselineMetrics(testResult.target, config);
  analysis.baseline = compareAgainstBaseline(testResult.metrics, baselineMetrics);

  // Step 3: Generate summary and recommendations
  analysis.summary = generatePerformanceSummary(analysis.validation, analysis.baseline);
  analysis.recommendations = [
    ...analysis.validation.recommendations,
    ...analysis.baseline.recommendations,
  ];

  return analysis;
}

/**
 * Perform performance validation against thresholds
 * @purpose Validate performance metrics against configured thresholds
 * @param {Object} metrics - Performance metrics to validate
 * @param {Object} config - Configuration with performance thresholds
 * @returns {Object} Validation results with pass/fail status for each metric
 * @usedBy analyzePerformanceTestResults
 */
async function performPerformanceValidation(metrics, config) {
  const validation = {
    overall: true,
    results: {},
    recommendations: [],
  };

  // Validate response time
  validation.results.responseTime = performResponseTimeValidation(metrics, config);
  if (!validation.results.responseTime.pass) {
    validation.overall = false;
  }

  // Validate P95 time
  validation.results.p95Time = performP95TimeValidation(metrics, config);
  if (!validation.results.p95Time.pass) {
    validation.overall = false;
  }

  // Validate consistency
  validation.results.consistency = performConsistencyValidation(metrics, config);
  if (!validation.results.consistency.pass) {
    validation.overall = false;
  }

  // Validate max time
  validation.results.maxTime = performMaxTimeValidation(metrics, config);
  if (!validation.results.maxTime.pass) {
    validation.overall = false;
  }

  // Generate validation recommendations
  Object.values(validation.results).forEach((result) => {
    if (result.recommendations) {
      validation.recommendations.push(...result.recommendations);
    }
  });

  return validation;
}

// Performance Validation Functions

/**
 * Validate response time against threshold
 * @purpose Check if average response time meets performance requirements
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Configuration with thresholds
 * @returns {Object} Response time validation result
 * @usedBy performPerformanceValidation
 */
function performResponseTimeValidation(metrics, config) {
  const threshold = config.performance?.thresholds?.responseTime || 5000;
  const responseTime = metrics.responseTime || 0;

  return {
    pass: responseTime <= threshold,
    metric: 'responseTime',
    value: responseTime,
    threshold,
    message:
      responseTime <= threshold
        ? `Response time ${responseTime}ms within threshold`
        : `Response time ${responseTime}ms exceeds threshold ${threshold}ms`,
    recommendations:
      responseTime > threshold ? ['Optimize slow endpoints', 'Consider caching strategies'] : [],
  };
}

/**
 * Validate P95 response time
 * @purpose Check if 95th percentile response time meets requirements
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Configuration with thresholds
 * @returns {Object} P95 validation result
 * @usedBy performPerformanceValidation
 */
function performP95TimeValidation(metrics, config) {
  const threshold = config.performance?.thresholds?.p95Time || 10000;
  const p95Time = metrics.p95Time || 0;

  return {
    pass: p95Time <= threshold,
    metric: 'p95Time',
    value: p95Time,
    threshold,
    message:
      p95Time <= threshold
        ? `P95 time ${p95Time}ms within threshold`
        : `P95 time ${p95Time}ms exceeds threshold ${threshold}ms`,
    recommendations:
      p95Time > threshold ? ['Investigate performance outliers', 'Review resource allocation'] : [],
  };
}

/**
 * Validate response time consistency
 * @purpose Check if response times are consistent (low standard deviation)
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Configuration with thresholds
 * @returns {Object} Consistency validation result
 * @usedBy performPerformanceValidation
 */
function performConsistencyValidation(metrics, config) {
  const threshold = config.performance?.thresholds?.consistency || 0.3;
  const coefficient = calculateConsistencyCoefficient(metrics);

  return {
    pass: coefficient <= threshold,
    metric: 'consistency',
    value: coefficient,
    threshold,
    message:
      coefficient <= threshold
        ? `Response time consistency good (${coefficient.toFixed(3)})`
        : `Response time inconsistent (${coefficient.toFixed(3)})`,
    recommendations:
      coefficient > threshold ? ['Investigate performance variability', 'Check system load'] : [],
  };
}

/**
 * Validate maximum response time
 * @purpose Check if maximum response time is within acceptable limits
 * @param {Object} metrics - Performance metrics
 * @param {Object} config - Configuration with thresholds
 * @returns {Object} Max time validation result
 * @usedBy performPerformanceValidation
 */
function performMaxTimeValidation(metrics, config) {
  const threshold = config.performance?.thresholds?.maxTime || 20000;
  const maxTime = metrics.maxTime || 0;

  return {
    pass: maxTime <= threshold,
    metric: 'maxTime',
    value: maxTime,
    threshold,
    message:
      maxTime <= threshold
        ? `Max time ${maxTime}ms within threshold`
        : `Max time ${maxTime}ms exceeds threshold ${threshold}ms`,
    recommendations:
      maxTime > threshold
        ? ['Investigate timeout scenarios', 'Optimize worst-case performance']
        : [],
  };
}

/**
 * Calculate consistency coefficient
 * @purpose Calculate coefficient of variation for response time consistency
 * @param {Object} metrics - Performance metrics
 * @returns {number} Consistency coefficient (0 = perfect consistency)
 */
function calculateConsistencyCoefficient(metrics) {
  const mean = metrics.responseTime || 0;
  const stdDev = metrics.standardDeviation || 0;
  return mean > 0 ? stdDev / mean : 0;
}

// Summary Generation

/**
 * Generate performance summary
 * @purpose Create comprehensive performance summary from validation and baseline results
 * @param {Object} validation - Validation results
 * @param {Object} baseline - Baseline comparison results
 * @returns {Object} Performance summary
 * @usedBy analyzePerformanceTestResults
 */
function generatePerformanceSummary(validation, baseline) {
  const passedValidations = Object.values(validation.results).filter((r) => r.pass).length;
  const totalValidations = Object.keys(validation.results).length;

  return {
    overallPass: validation.overall,
    validationScore: `${passedValidations}/${totalValidations}`,
    hasBaseline: baseline.hasBaseline,
    baselineTrend: baseline.trend || 'no-baseline',
    summary: validation.overall
      ? 'Performance meets all thresholds'
      : 'Performance issues detected',
  };
}

/**
 * Generate baseline comparison summary
 * @purpose Create summary of baseline comparison results
 * @param {Object} comparison - Baseline comparison results
 * @returns {string} Comparison summary text
 * @usedBy Performance reporting
 */
function generateBaselineComparisonSummary(comparison) {
  if (!comparison.hasBaseline) {
    return 'No baseline data available for comparison';
  }

  const { trend } = comparison;
  const { responseTime } = comparison.comparison;

  return `Performance ${trend}: Response time ${responseTime.direction} by ${responseTime.percentage}%`;
}

module.exports = {
  // Performance Results Analysis
  analyzePerformanceTestResults,
  performPerformanceValidation,

  // Performance Validation Functions
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
