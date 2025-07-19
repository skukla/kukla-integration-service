/**
 * Test Orchestration - Result Aggregation Feature Core
 * Main test result aggregation capability with comprehensive metrics compilation
 */

// Import aggregation operations from sub-modules
const {
  calculatePerformanceMetrics,
  calculatePerformanceDistribution,
} = require('./result-aggregation/performance-metrics');
const { analyzeTestTypes, generateTestInsights } = require('./result-aggregation/test-insights');
const {
  calculateTimingMetrics,
  calculateTimingDistribution,
  calculateTimingScore,
} = require('./result-aggregation/timing-metrics');

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
