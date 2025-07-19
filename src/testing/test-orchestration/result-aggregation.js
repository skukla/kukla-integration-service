/**
 * Test Orchestration - Result Aggregation Sub-module
 * All test result aggregation utilities including metrics compilation, result building, and summary generation
 */

// Test Result Aggregation

/**
 * Aggregate test results into comprehensive metrics
 * @purpose Compile individual test results into overall suite metrics and insights
 * @param {Object} executionResult - Raw execution result with individual test results
 * @returns {Object} Aggregated metrics with success rates, timing, and analysis
 * @usedBy executeTestOrchestrationWorkflow
 */
function aggregateTestResults(executionResult) {
  const { results, executionTime, executionMode, suite } = executionResult;

  if (!results || results.length === 0) {
    return createEmptyAggregation(executionTime, executionMode, suite);
  }

  // Calculate basic metrics
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = (passedTests / totalTests) * 100;

  // Calculate timing metrics
  const timingMetrics = calculateTimingMetrics(results);

  // Analyze test types
  const typeAnalysis = analyzeTestTypes(results);

  // Calculate performance metrics
  const performanceMetrics = calculatePerformanceMetrics(results);

  // Generate insights and recommendations
  const insights = generateTestInsights(results, successRate, timingMetrics);

  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      executionTime,
      executionMode,
      suite,
    },
    timing: timingMetrics,
    typeAnalysis,
    performance: performanceMetrics,
    insights,
    grade: calculateOverallGrade(successRate, timingMetrics, performanceMetrics),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create empty aggregation for failed executions
 * @purpose Provide default aggregation structure when no results are available
 * @param {number} executionTime - Total execution time
 * @param {string} executionMode - Execution mode (parallel/sequential)
 * @param {string} suite - Suite name
 * @returns {Object} Empty aggregation object
 * @usedBy aggregateTestResults
 */
function createEmptyAggregation(executionTime, executionMode, suite) {
  return {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0,
      executionTime,
      executionMode,
      suite,
    },
    timing: { averageTime: 0, totalTime: 0, fastestTest: 0, slowestTest: 0 },
    typeAnalysis: {},
    performance: { averageScore: 0, bestPerformer: null, worstPerformer: null },
    insights: [],
    grade: 'F',
    timestamp: new Date().toISOString(),
  };
}

// Timing Metrics Calculation

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

// Test Type Analysis

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

// Performance Metrics Calculation

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

// Test Insights Generation

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

// Result Building

/**
 * Build comprehensive test orchestration result
 * @purpose Create complete test orchestration result with all metrics and analysis
 * @param {Object} testPlan - Original test plan
 * @param {Object} executionResult - Raw execution results
 * @param {Object} aggregatedResults - Aggregated metrics and analysis
 * @returns {Object} Complete test orchestration result
 * @usedBy executeTestOrchestrationWorkflow
 */
function buildTestOrchestrationResult(testPlan, executionResult, aggregatedResults) {
  return {
    success: executionResult.success,
    suite: testPlan.suite,
    executionMode: testPlan.executionMode,

    // Summary metrics
    summary: aggregatedResults.summary,

    // Detailed analysis
    analysis: {
      timing: aggregatedResults.timing,
      typeAnalysis: aggregatedResults.typeAnalysis,
      performance: aggregatedResults.performance,
    },

    // Insights and recommendations
    insights: aggregatedResults.insights,
    grade: aggregatedResults.grade,

    // Raw results (if needed for debugging)
    results: executionResult.results,

    // Execution metadata
    metadata: {
      startTime: testPlan.startTime,
      endTime: new Date().toISOString(),
      totalExecutionTime: executionResult.executionTime,
      testPlan: {
        suite: testPlan.suite,
        parallel: testPlan.parallel,
        timeout: testPlan.timeout,
      },
    },
  };
}

/**
 * Build test orchestration error result
 * @purpose Create standardized error result when orchestration fails
 * @param {Error|string} error - Error that occurred during orchestration
 * @returns {Object} Standardized test orchestration error result
 * @usedBy executeTestOrchestrationWorkflow
 */
function buildTestOrchestrationErrorResult(error) {
  const errorMessage = error?.message || error || 'Unknown test orchestration error';

  return {
    success: false,
    error: errorMessage,
    suite: 'unknown',
    executionMode: 'unknown',
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0,
      executionTime: 0,
    },
    analysis: {},
    insights: [
      {
        type: 'error',
        severity: 'critical',
        message: `Test orchestration failed: ${errorMessage}`,
        recommendation: 'Check test configuration and system status',
      },
    ],
    grade: 'F',
    results: [],
    metadata: {
      endTime: new Date().toISOString(),
    },
  };
}

// Grade Calculation

/**
 * Calculate overall grade for test execution
 * @purpose Provide letter grade based on success rate, timing, and performance
 * @param {number} successRate - Overall success rate percentage
 * @param {Object} timingMetrics - Timing analysis results
 * @param {Object} performanceMetrics - Performance analysis results
 * @returns {string} Letter grade (A, B, C, D, F)
 * @usedBy aggregateTestResults
 */
function calculateOverallGrade(successRate, timingMetrics, performanceMetrics) {
  let score = 0;

  // Success rate contributes 60% of grade
  score += (successRate / 100) * 60;

  // Timing contributes 25% of grade
  const timingScore = calculateTimingScore(timingMetrics.averageTime);
  score += (timingScore / 100) * 25;

  // Performance contributes 15% of grade
  const performanceScore = performanceMetrics.averageScore || 70; // Default decent score
  score += (performanceScore / 100) * 15;

  // Convert to letter grade
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
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
  // Test Result Aggregation
  aggregateTestResults,
  createEmptyAggregation,

  // Timing Metrics Calculation
  calculateTimingMetrics,
  calculateTimingDistribution,

  // Test Type Analysis
  analyzeTestTypes,

  // Performance Metrics Calculation
  calculatePerformanceMetrics,
  calculatePerformanceDistribution,

  // Test Insights Generation
  generateTestInsights,

  // Result Building
  buildTestOrchestrationResult,
  buildTestOrchestrationErrorResult,

  // Grade Calculation
  calculateOverallGrade,
  calculateTimingScore,
};
