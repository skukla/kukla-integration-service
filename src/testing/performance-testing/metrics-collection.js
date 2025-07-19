/**
 * Performance Testing - Metrics Collection Sub-module
 * All performance metrics calculation utilities including timing analysis, statistical calculations, and data aggregation
 */

// Performance Metrics Calculation

/**
 * Calculate comprehensive performance metrics from test results
 * @purpose Analyze test iteration results and generate statistical performance metrics
 * @param {Array} iterations - Array of test iteration results
 * @returns {Object} Complete performance metrics with timing statistics
 * @usedBy analyzePerformanceTestResults
 */
function calculatePerformanceMetrics(iterations) {
  if (!iterations || iterations.length === 0) {
    return createEmptyMetrics();
  }

  // Filter out failed iterations for timing calculations
  const successfulIterations = iterations.filter((i) => i.success);
  const executionTimes = successfulIterations.map((i) => i.executionTime);

  if (executionTimes.length === 0) {
    return createEmptyMetrics();
  }

  // Calculate basic statistics
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);

  const metrics = {
    totalIterations: iterations.length,
    successfulIterations: successfulIterations.length,
    failedIterations: iterations.length - successfulIterations.length,
    successRate: (successfulIterations.length / iterations.length) * 100,

    // Timing metrics
    minTime: Math.min(...executionTimes),
    maxTime: Math.max(...executionTimes),
    averageTime: totalTime / executionTimes.length,
    medianTime: calculateMedian(sortedTimes),

    // Percentile metrics
    p50: calculatePercentile(sortedTimes, 50),
    p90: calculatePercentile(sortedTimes, 90),
    p95: calculatePercentile(sortedTimes, 95),
    p99: calculatePercentile(sortedTimes, 99),

    // Statistical measures
    standardDeviation: calculateStandardDeviation(executionTimes),
    variance: calculateVariance(executionTimes),

    // Performance indicators
    totalTime,
    throughput: successfulIterations.length / (totalTime / 1000), // Operations per second
  };

  // Add quality indicators
  metrics.consistency = calculateConsistencyScore(metrics);
  metrics.performanceGrade = calculatePerformanceGrade(metrics);

  return metrics;
}

/**
 * Create empty metrics object for failed test scenarios
 * @purpose Provide default metrics structure when no valid data is available
 * @returns {Object} Empty metrics object with zero values
 * @usedBy calculatePerformanceMetrics
 */
function createEmptyMetrics() {
  return {
    totalIterations: 0,
    successfulIterations: 0,
    failedIterations: 0,
    successRate: 0,
    minTime: 0,
    maxTime: 0,
    averageTime: 0,
    medianTime: 0,
    p50: 0,
    p90: 0,
    p95: 0,
    p99: 0,
    standardDeviation: 0,
    variance: 0,
    totalTime: 0,
    throughput: 0,
    consistency: 0,
    performanceGrade: 'F',
  };
}

// Statistical Calculations

/**
 * Calculate median value from sorted array
 * @purpose Find the middle value in a sorted dataset
 * @param {Array} sortedArray - Pre-sorted array of numbers
 * @returns {number} Median value
 * @usedBy calculatePerformanceMetrics
 */
function calculateMedian(sortedArray) {
  const length = sortedArray.length;
  if (length === 0) return 0;

  const middle = Math.floor(length / 2);

  if (length % 2 === 0) {
    return (sortedArray[middle - 1] + sortedArray[middle]) / 2;
  } else {
    return sortedArray[middle];
  }
}

/**
 * Calculate percentile value from sorted array
 * @purpose Find the value below which a percentage of observations fall
 * @param {Array} sortedArray - Pre-sorted array of numbers
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 * @usedBy calculatePerformanceMetrics
 */
function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  if (percentile <= 0) return sortedArray[0];
  if (percentile >= 100) return sortedArray[sortedArray.length - 1];

  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedArray[lower];
  }

  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calculate standard deviation of execution times
 * @purpose Measure the amount of variation in execution times
 * @param {Array} executionTimes - Array of execution time values
 * @returns {number} Standard deviation value
 * @usedBy calculatePerformanceMetrics
 */
function calculateStandardDeviation(executionTimes) {
  if (executionTimes.length === 0) return 0;

  const variance = calculateVariance(executionTimes);
  return Math.sqrt(variance);
}

/**
 * Calculate variance of execution times
 * @purpose Measure the spread of execution times around the mean
 * @param {Array} executionTimes - Array of execution time values
 * @returns {number} Variance value
 * @usedBy calculateStandardDeviation, calculatePerformanceMetrics
 */
function calculateVariance(executionTimes) {
  if (executionTimes.length === 0) return 0;

  const mean = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
  const squaredDifferences = executionTimes.map((time) => Math.pow(time - mean, 2));

  return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / executionTimes.length;
}

// Performance Quality Indicators

/**
 * Calculate consistency score based on performance variance
 * @purpose Provide a score indicating how consistent the performance is
 * @param {Object} metrics - Performance metrics object
 * @returns {number} Consistency score from 0-100
 * @usedBy calculatePerformanceMetrics
 */
function calculateConsistencyScore(metrics) {
  if (metrics.averageTime === 0) return 0;

  // Consistency based on coefficient of variation (lower is better)
  const coefficientOfVariation = metrics.standardDeviation / metrics.averageTime;

  // Convert to 0-100 scale (100 = perfectly consistent)
  const consistencyScore = Math.max(0, 100 - coefficientOfVariation * 100);

  return Math.round(consistencyScore);
}

/**
 * Calculate overall performance grade
 * @purpose Provide a letter grade for overall performance quality
 * @param {Object} metrics - Performance metrics object
 * @returns {string} Performance grade (A, B, C, D, F)
 * @usedBy calculatePerformanceMetrics
 */
function calculatePerformanceGrade(metrics) {
  // Weighted scoring system
  const successRateScore = metrics.successRate; // 0-100
  const consistencyScore = metrics.consistency; // 0-100
  const speedScore = calculateSpeedScore(metrics.averageTime); // 0-100

  // Weighted average (success rate is most important)
  const overallScore = successRateScore * 0.5 + speedScore * 0.3 + consistencyScore * 0.2;

  // Convert to letter grade
  if (overallScore >= 90) return 'A';
  if (overallScore >= 80) return 'B';
  if (overallScore >= 70) return 'C';
  if (overallScore >= 60) return 'D';
  return 'F';
}

/**
 * Calculate speed score based on average execution time
 * @purpose Convert execution time to a 0-100 performance score
 * @param {number} averageTime - Average execution time in milliseconds
 * @returns {number} Speed score from 0-100
 * @usedBy calculatePerformanceGrade
 */
function calculateSpeedScore(averageTime) {
  // Speed scoring thresholds (in milliseconds)
  const excellent = 500; // 100 points
  const good = 1000; // 80 points
  const acceptable = 2000; // 60 points
  const poor = 5000; // 20 points
  // anything above poor = 0 points

  if (averageTime <= excellent) return 100;
  if (averageTime <= good) return 80;
  if (averageTime <= acceptable) return 60;
  if (averageTime <= poor) return 20;
  return 0;
}

module.exports = {
  // Performance Metrics Calculation
  calculatePerformanceMetrics,
  createEmptyMetrics,

  // Statistical Calculations
  calculateMedian,
  calculatePercentile,
  calculateStandardDeviation,
  calculateVariance,

  // Performance Quality Indicators
  calculateConsistencyScore,
  calculatePerformanceGrade,
  calculateSpeedScore,
};
