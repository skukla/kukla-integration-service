/**
 * Performance Testing - Reporting Sub-module
 * All performance test result building utilities including success results, error handling, and formatted output
 */

// Performance Test Result Building

/**
 * Build comprehensive performance test result
 * @purpose Create complete performance test result with metrics, analysis, and formatted output
 * @param {string} target - Target that was performance tested
 * @param {Object} testResult - Raw performance test execution results
 * @param {Object} analysis - Complete performance analysis with metrics and validation
 * @param {Object} scenario - Test scenario configuration
 * @param {Object} options - Test options for result customization
 * @returns {Object} Complete formatted performance test result
 * @usedBy executePerformanceTestWorkflow
 */
function buildPerformanceTestResult(target, testResult, analysis, scenario, options) {
  const { rawOutput = false, includeIterations = false } = options;

  // Build core result structure
  const result = buildCorePerformanceResult(target, testResult, analysis, scenario);

  // Add optional data based on options
  addOptionalResultData(result, analysis, options, rawOutput, includeIterations);

  // Add iteration data if requested
  if (includeIterations) {
    addIterationData(result, testResult);
  }

  // Add error details if test failed
  if (!testResult.success) {
    addErrorDetails(result, testResult);
  }

  // Calculate overall score
  result.score = calculateOverallPerformanceScore(analysis);

  return result;
}

/**
 * Build core performance result structure
 * @purpose Create the basic result structure with essential metrics
 * @param {string} target - Target that was tested
 * @param {Object} testResult - Raw test results
 * @param {Object} analysis - Performance analysis
 * @param {Object} scenario - Test scenario
 * @returns {Object} Core result structure
 * @usedBy buildPerformanceTestResult
 */
function buildCorePerformanceResult(target, testResult, analysis, scenario) {
  return {
    success: testResult.success && analysis.validation.overallPass,
    target,
    scenario: scenario.name,
    duration: calculateTotalTestDuration(testResult),

    // Core metrics
    metrics: {
      averageTime: Math.round(analysis.metrics.averageTime),
      p95Time: Math.round(analysis.metrics.p95),
      successRate: analysis.metrics.successRate,
      consistency: analysis.metrics.consistency,
      grade: analysis.metrics.performanceGrade,
    },

    // Validation results
    validation: {
      passed: analysis.validation.overallPass,
      grade: analysis.validation.grade,
      checksPerformed: analysis.validation.checksPerformed,
      checksPassed: analysis.validation.checksPassed,
      checksFailed: analysis.validation.checksFailed,
    },

    // Summary information
    summary: analysis.summary,
    timestamp: testResult.endTime || new Date().toISOString(),
  };
}

/**
 * Add optional result data based on configuration
 * @purpose Add baseline comparison and recommendations to result
 * @param {Object} result - Result object to modify
 * @param {Object} analysis - Performance analysis
 * @param {Object} options - Test options
 * @param {boolean} rawOutput - Whether to include raw output
 * @param {boolean} includeIterations - Whether to include iteration data
 * @usedBy buildPerformanceTestResult
 */
function addOptionalResultData(result, analysis, options, rawOutput, includeIterations) {
  // Add baseline comparison if available
  if (analysis.baselineComparison?.hasBaseline) {
    result.baselineComparison = {
      trend: analysis.baselineComparison.trend.overall,
      confidence: analysis.baselineComparison.trend.confidence,
      summary: analysis.baselineComparison.summary,
    };
  }

  // Add recommendations if any
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    result.recommendations = analysis.recommendations.map((rec) => ({
      type: rec.type,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
    }));
  }

  // Add detailed data if requested
  if (rawOutput || includeIterations) {
    result.detailedMetrics = analysis.metrics;
    result.validationChecks = analysis.validation.checks;
  }
}

/**
 * Add iteration data to result
 * @purpose Include detailed iteration information in result
 * @param {Object} result - Result object to modify
 * @param {Object} testResult - Raw test results
 * @usedBy buildPerformanceTestResult
 */
function addIterationData(result, testResult) {
  result.iterations = {
    warmup: testResult.warmupResults,
    test: testResult.testResults,
    total: testResult.totalIterations,
    completed: testResult.completedIterations,
  };
}

/**
 * Add error details to result
 * @purpose Include error information for failed tests
 * @param {Object} result - Result object to modify
 * @param {Object} testResult - Raw test results
 * @usedBy buildPerformanceTestResult
 */
function addErrorDetails(result, testResult) {
  result.error = testResult.error || 'Performance test execution failed';
  result.executionError = true;
}

/**
 * Build performance test error result
 * @purpose Create standardized error result when performance test fails completely
 * @param {Error|string} error - Error that occurred during testing
 * @param {string} target - Target that was being tested
 * @returns {Object} Standardized performance test error result
 * @usedBy executePerformanceTestWorkflow, executePerformanceTestWithScenario
 */
function buildPerformanceTestErrorResult(error, target) {
  const errorMessage = error?.message || error || 'Unknown performance test error';

  return {
    success: false,
    target,
    error: errorMessage,
    duration: 0,
    metrics: {
      averageTime: 0,
      p95Time: 0,
      successRate: 0,
      consistency: 0,
      grade: 'F',
    },
    validation: {
      passed: false,
      grade: 'F',
      checksPerformed: 0,
      checksPassed: 0,
      checksFailed: 0,
    },
    score: 0,
    timestamp: new Date().toISOString(),
    executionError: true,
  };
}

// Test Duration and Scoring

/**
 * Calculate total test duration from test result
 * @purpose Determine the total time spent executing the performance test
 * @param {Object} testResult - Performance test execution result
 * @returns {number} Total test duration in milliseconds
 * @usedBy buildPerformanceTestResult
 */
function calculateTotalTestDuration(testResult) {
  if (!testResult.startTime || !testResult.endTime) {
    return 0;
  }

  const startTime = new Date(testResult.startTime).getTime();
  const endTime = new Date(testResult.endTime).getTime();

  return endTime - startTime;
}

/**
 * Calculate overall performance score
 * @purpose Provide numerical score for overall performance test quality
 * @param {Object} analysis - Complete performance analysis
 * @returns {number} Overall performance score from 0-100
 * @usedBy buildPerformanceTestResult
 */
function calculateOverallPerformanceScore(analysis) {
  const { metrics, validation, baselineComparison } = analysis;

  let score = 0;

  // Base score from metrics grade
  const gradeScores = { A: 90, B: 80, C: 70, D: 60, F: 0 };
  score += gradeScores[metrics.performanceGrade] || 0;

  // Bonus/penalty for validation results
  if (validation.overallPass) {
    score += 10; // Bonus for passing all validations
  } else {
    const penaltyPerFailure = 5;
    score -= validation.checksFailed * penaltyPerFailure;
  }

  // Bonus/penalty for baseline comparison
  if (baselineComparison?.hasBaseline) {
    if (baselineComparison.trend.overall === 'improving') {
      score += 5;
    } else if (baselineComparison.trend.overall === 'degrading') {
      score -= 10;
    }
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
}

// Result Formatting

/**
 * Format performance test result for display
 * @purpose Create human-readable summary of performance test results
 * @param {Object} result - Complete performance test result
 * @returns {string} Formatted result summary
 * @usedBy Test display utilities
 */
function formatPerformanceTestResultSummary(result) {
  const status = result.success ? '✅ PASSED' : '❌ FAILED';
  const duration = `${result.duration}ms`;
  const score = `${result.score}/100`;
  const grade = result.metrics.grade;

  let summary = `${status} | ${result.target} | ${duration} | Grade: ${grade} | Score: ${score}`;

  if (result.metrics.averageTime > 0) {
    summary += ` | Avg: ${result.metrics.averageTime}ms`;
  }

  if (result.validation.checksFailed > 0) {
    summary += ` | ${result.validation.checksFailed} checks failed`;
  }

  if (result.baselineComparison?.trend) {
    summary += ` | Trend: ${result.baselineComparison.trend}`;
  }

  return summary;
}

/**
 * Extract key metrics from performance test result
 * @purpose Get essential metrics for monitoring and reporting
 * @param {Object} result - Complete performance test result
 * @returns {Object} Key metrics object
 * @usedBy Performance monitoring and aggregation
 */
function extractPerformanceTestMetrics(result) {
  return {
    success: result.success,
    target: result.target,
    scenario: result.scenario,
    duration: result.duration,
    averageTime: result.metrics.averageTime,
    p95Time: result.metrics.p95Time,
    successRate: result.metrics.successRate,
    consistency: result.metrics.consistency,
    grade: result.metrics.grade,
    score: result.score,
    validationPassed: result.validation.passed,
    checksFailed: result.validation.checksFailed,
    timestamp: result.timestamp,
  };
}

/**
 * Format detailed performance metrics for reporting
 * @purpose Create comprehensive metrics report for analysis
 * @param {Object} metrics - Performance metrics object
 * @returns {string} Formatted metrics report
 * @usedBy Detailed performance reporting
 */
function formatDetailedPerformanceMetrics(metrics) {
  const lines = [
    'Performance Metrics Summary:',
    `  Total Iterations: ${metrics.totalIterations}`,
    `  Successful: ${metrics.successfulIterations} (${metrics.successRate.toFixed(1)}%)`,
    `  Failed: ${metrics.failedIterations}`,
    '',
    'Timing Statistics:',
    `  Average: ${Math.round(metrics.averageTime)}ms`,
    `  Median: ${Math.round(metrics.medianTime)}ms`,
    `  Min: ${Math.round(metrics.minTime)}ms`,
    `  Max: ${Math.round(metrics.maxTime)}ms`,
    '',
    'Percentiles:',
    `  P50: ${Math.round(metrics.p50)}ms`,
    `  P90: ${Math.round(metrics.p90)}ms`,
    `  P95: ${Math.round(metrics.p95)}ms`,
    `  P99: ${Math.round(metrics.p99)}ms`,
    '',
    'Quality Indicators:',
    `  Consistency: ${metrics.consistency}/100`,
    `  Performance Grade: ${metrics.performanceGrade}`,
    `  Throughput: ${metrics.throughput.toFixed(2)} ops/sec`,
  ];

  return lines.join('\n');
}

module.exports = {
  // Performance Test Result Building
  buildPerformanceTestResult,
  buildPerformanceTestErrorResult,
  buildCorePerformanceResult,
  addOptionalResultData,
  addIterationData,
  addErrorDetails,

  // Test Duration and Scoring
  calculateTotalTestDuration,
  calculateOverallPerformanceScore,

  // Result Formatting
  formatPerformanceTestResultSummary,
  extractPerformanceTestMetrics,
  formatDetailedPerformanceMetrics,
};
