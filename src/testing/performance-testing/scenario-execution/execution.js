/**
 * Scenario Execution - Execution Sub-module
 * Performance test execution logic including iteration handling and result collection
 */

const { sleep } = require('../../../shared/utils/async');

// Scenario Execution Workflows

/**
 * Execute performance test scenario with comprehensive metrics collection
 * @purpose Run complete performance test scenario with timing, validation, and error handling
 * @param {string} target - Target to test
 * @param {Object} scenario - Scenario configuration
 * @param {Function} testFunction - Function to execute for performance measurement
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Complete scenario execution result
 * @usedBy executePerformanceTestScenario
 */
async function executeScenarioWithMetrics(target, scenario, testFunction, options) {
  const startTime = Date.now();
  const results = [];
  const errors = [];

  try {
    // Step 1: Execute warmup iterations
    if (scenario.warmupIterations > 0) {
      await executeWarmupIterations(scenario, testFunction, options);
    }

    // Step 2: Execute main test iterations
    const iterationResults = await executeMainIterations(scenario, testFunction);
    results.push(...iterationResults.results);
    errors.push(...iterationResults.errors);

    // Step 3: Calculate performance metrics
    const metrics = calculateScenarioMetrics(results, startTime);

    // Step 4: Validate performance expectations
    const validation = validateScenarioPerformance(metrics, scenario);

    return {
      success: errors.length === 0 && validation.passed,
      target,
      scenario: scenario.name,
      results,
      errors,
      metrics,
      validation,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      target,
      scenario: scenario.name,
      error: error.message,
      results,
      errors: [...errors, error.message],
      executionTime: Date.now() - startTime,
    };
  }
}

// Scenario Execution Operations

/**
 * Execute warmup iterations to prepare for main test
 * @purpose Run warmup iterations to stabilize environment before main testing
 * @param {Object} scenario - Scenario configuration
 * @param {Function} testFunction - Function to execute
 * @param {Object} options - Execution options
 * @returns {Promise<void>} Completes after warmup iterations
 * @usedBy executeScenarioWithMetrics
 */
async function executeWarmupIterations(scenario, testFunction, options) {
  for (let i = 0; i < scenario.warmupIterations; i++) {
    try {
      await testFunction();
      // Brief pause between warmup iterations
      await sleep(100);
    } catch (error) {
      // Warmup errors are logged but don't fail the test
      if (options.verbose) {
        console.log(`Warmup iteration ${i + 1} error: ${error.message}`);
      }
    }
  }
}

/**
 * Execute main test iterations with metrics collection
 * @purpose Run main test iterations with comprehensive result collection
 * @param {Object} scenario - Scenario configuration
 * @param {Function} testFunction - Function to execute
 * @returns {Promise<Object>} Iteration execution results and errors
 * @usedBy executeScenarioWithMetrics
 */
async function executeMainIterations(scenario, testFunction) {
  const results = [];
  const errors = [];

  if (scenario.concurrent) {
    // Execute concurrent iterations
    const concurrentResults = await executeConcurrentIterations(scenario, testFunction);
    results.push(...concurrentResults.results);
    errors.push(...concurrentResults.errors);
  } else {
    // Execute sequential iterations
    for (let i = 0; i < scenario.iterations; i++) {
      const iterationResult = await executeSingleIteration(i + 1, testFunction);

      if (iterationResult.success) {
        results.push(iterationResult);
      } else {
        errors.push(iterationResult.error);
      }

      // Brief pause between iterations
      await sleep(50);
    }
  }

  return { results, errors };
}

/**
 * Execute concurrent iterations for stress testing
 * @purpose Run multiple concurrent iterations for load testing
 * @param {Object} scenario - Scenario configuration
 * @param {Function} testFunction - Function to execute
 * @returns {Promise<Object>} Concurrent execution results and errors
 * @usedBy executeMainIterations
 */
async function executeConcurrentIterations(scenario, testFunction) {
  const concurrentUsers = scenario.concurrentUsers || 3;
  const iterationsPerUser = Math.ceil(scenario.iterations / concurrentUsers);

  const userPromises = [];

  for (let user = 0; user < concurrentUsers; user++) {
    const userPromise = executeConcurrentUser(user + 1, iterationsPerUser, testFunction);
    userPromises.push(userPromise);
  }

  const userResults = await Promise.allSettled(userPromises);

  const results = [];
  const errors = [];

  userResults.forEach((userResult, userIndex) => {
    if (userResult.status === 'fulfilled') {
      results.push(...userResult.value.results);
      errors.push(...userResult.value.errors);
    } else {
      errors.push(`Concurrent user ${userIndex + 1} failed: ${userResult.reason}`);
    }
  });

  return { results, errors };
}

// Scenario Execution Utilities

/**
 * Execute single iteration with timing and error handling
 * @purpose Execute one test iteration with comprehensive metrics collection
 * @param {number} iterationNumber - Current iteration number
 * @param {Function} testFunction - Function to execute
 * @returns {Promise<Object>} Single iteration result
 * @usedBy executeMainIterations
 */
async function executeSingleIteration(iterationNumber, testFunction) {
  const startTime = Date.now();

  try {
    const result = await testFunction();
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      iteration: iterationNumber,
      executionTime,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      iteration: iterationNumber,
      executionTime: Date.now() - startTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Execute concurrent user iterations
 * @purpose Execute iterations for a single concurrent user
 * @param {number} userId - User identifier
 * @param {number} iterations - Number of iterations for this user
 * @param {Function} testFunction - Function to execute
 * @returns {Promise<Object>} User execution results
 * @usedBy executeConcurrentIterations
 */
async function executeConcurrentUser(userId, iterations, testFunction) {
  const results = [];
  const errors = [];

  for (let i = 0; i < iterations; i++) {
    const iterationResult = await executeSingleIteration(`${userId}-${i + 1}`, testFunction);

    if (iterationResult.success) {
      results.push({
        ...iterationResult,
        userId,
        userIteration: i + 1,
      });
    } else {
      errors.push(`User ${userId} iteration ${i + 1}: ${iterationResult.error}`);
    }

    // Brief pause between user iterations
    await sleep(25);
  }

  return { results, errors };
}

/**
 * Calculate comprehensive scenario metrics
 * @purpose Calculate performance metrics from execution results
 * @param {Array} results - Array of iteration results
 * @param {number} startTime - Scenario start time
 * @returns {Object} Calculated performance metrics
 * @usedBy executeScenarioWithMetrics
 */
function calculateScenarioMetrics(results, startTime) {
  if (results.length === 0) {
    return {
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
      totalTime: Date.now() - startTime,
      iterations: 0,
      successRate: 0,
    };
  }

  const executionTimes = results.map((r) => r.executionTime);
  const totalIterations = results.length;
  const successfulIterations = results.filter((r) => r.success).length;

  return {
    averageTime: Math.round(executionTimes.reduce((sum, time) => sum + time, 0) / totalIterations),
    minTime: Math.min(...executionTimes),
    maxTime: Math.max(...executionTimes),
    totalTime: Date.now() - startTime,
    iterations: totalIterations,
    successRate: (successfulIterations / totalIterations) * 100,
  };
}

/**
 * Validate scenario performance against expectations
 * @purpose Check if performance metrics meet scenario expectations
 * @param {Object} metrics - Calculated performance metrics
 * @param {Object} scenario - Scenario configuration with expectations
 * @returns {Object} Validation result with pass/fail status
 * @usedBy executeScenarioWithMetrics
 */
function validateScenarioPerformance(metrics, scenario) {
  const violations = [];

  if (metrics.averageTime > scenario.expectedResponseTime) {
    violations.push(
      `Average response time ${metrics.averageTime}ms exceeds expected ${scenario.expectedResponseTime}ms`
    );
  }

  if (metrics.maxTime > scenario.maxExecutionTime) {
    violations.push(
      `Maximum execution time ${metrics.maxTime}ms exceeds limit ${scenario.maxExecutionTime}ms`
    );
  }

  if (metrics.successRate < 95) {
    violations.push(`Success rate ${metrics.successRate}% below required 95%`);
  }

  return {
    passed: violations.length === 0,
    violations,
    metrics,
  };
}

module.exports = {
  // Scenario execution workflows
  executeScenarioWithMetrics,

  // Scenario execution operations
  executeWarmupIterations,
  executeMainIterations,
  executeConcurrentIterations,

  // Scenario execution utilities
  executeSingleIteration,
  executeConcurrentUser,
  calculateScenarioMetrics,
  validateScenarioPerformance,
};
