/**
 * Test Orchestration - Parallel Execution Sub-module
 * All test execution utilities including parallel execution, sequential execution, and single test management
 */

const { executeActionTestWorkflow } = require('../action-testing');
const { executeApiTestWorkflow } = require('../api-testing');
const { executePerformanceTestWorkflow } = require('../performance-testing');

// Test Suite Execution

/**
 * Execute complete test suite based on plan
 * @purpose Run all tests in a suite using the appropriate execution strategy
 * @param {Object} testPlan - Complete test plan with suite configuration
 * @returns {Promise<Object>} Test suite execution result with all test results
 * @usedBy executeTestOrchestrationWorkflow
 */
async function executeTestSuite(testPlan) {
  const startTime = Date.now();

  try {
    // Step 1: Build execution list from test plan
    const tests = buildTestExecutionList(testPlan);

    // Step 2: Execute tests based on execution mode
    let executionResult;
    if (testPlan.executionMode === 'parallel') {
      executionResult = await executeTestsInParallel(tests);
    } else {
      executionResult = await executeTestsSequentially(tests);
    }

    // Step 3: Add execution metadata
    executionResult.executionTime = Date.now() - startTime;
    executionResult.executionMode = testPlan.executionMode;
    executionResult.suite = testPlan.suite;

    return executionResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime,
      executionMode: testPlan.executionMode,
      suite: testPlan.suite,
      results: [],
    };
  }
}

/**
 * Build test execution list from test plan
 * @purpose Create executable test list with proper configuration
 * @param {Object} testPlan - Test plan with suite configuration
 * @returns {Array} Array of executable test configurations
 * @usedBy executeTestSuite
 */
function buildTestExecutionList(testPlan) {
  const { suiteConfig, timeout: globalTimeout, verbose } = testPlan;

  return suiteConfig.tests.map((test, index) => ({
    id: `${testPlan.suite}-${index + 1}`,
    type: test.type,
    target: test.target,
    timeout: test.timeout || globalTimeout || 10000,
    scenario: test.scenario || 'quick',
    options: {
      verbose,
      isProd: false,
      ...test.options,
    },
    metadata: {
      suite: testPlan.suite,
      index: index + 1,
      total: suiteConfig.tests.length,
    },
  }));
}

// Parallel Test Execution

/**
 * Execute tests in parallel
 * @purpose Run multiple tests simultaneously for faster execution
 * @param {Array} tests - Array of test configurations
 * @returns {Promise<Object>} Parallel execution result with all test results
 * @usedBy executeTestSuite
 */
async function executeTestsInParallel(tests) {
  const startTime = Date.now();

  try {
    // Create promises for all tests
    const testPromises = tests.map((test) =>
      executeSingleTest(test).catch((error) => ({
        ...test,
        success: false,
        error: error.message,
        executionTime: 0,
        timestamp: new Date().toISOString(),
      }))
    );

    // Execute all tests in parallel
    const results = await Promise.all(testPromises);

    // Calculate execution summary
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;

    return {
      success: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      results,
      executionTime: Date.now() - startTime,
      parallel: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      totalTests: tests.length,
      passedTests: 0,
      failedTests: tests.length,
      results: [],
      executionTime: Date.now() - startTime,
      parallel: true,
    };
  }
}

// Sequential Test Execution

/**
 * Execute tests sequentially
 * @purpose Run tests one by one for performance testing or when order matters
 * @param {Array} tests - Array of test configurations
 * @returns {Promise<Object>} Sequential execution result with all test results
 * @usedBy executeTestSuite
 */
async function executeTestsSequentially(tests) {
  const startTime = Date.now();
  const results = [];
  let passedTests = 0;
  let failedTests = 0;

  try {
    for (const test of tests) {
      try {
        const result = await executeSingleTest(test);
        results.push(result);

        if (result.success) {
          passedTests++;
        } else {
          failedTests++;
        }

        // Add small delay between tests for sequential execution
        if (test !== tests[tests.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        const failedResult = {
          ...test,
          success: false,
          error: error.message,
          executionTime: 0,
          timestamp: new Date().toISOString(),
        };

        results.push(failedResult);
        failedTests++;
      }
    }

    return {
      success: failedTests === 0,
      totalTests: tests.length,
      passedTests,
      failedTests,
      results,
      executionTime: Date.now() - startTime,
      parallel: false,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      totalTests: tests.length,
      passedTests,
      failedTests,
      results,
      executionTime: Date.now() - startTime,
      parallel: false,
    };
  }
}

// Single Test Execution

/**
 * Execute single test with appropriate test type handler
 * @purpose Route test to correct testing workflow and handle execution
 * @param {Object} test - Individual test configuration
 * @returns {Promise<Object>} Single test execution result
 * @usedBy executeTestsInParallel, executeTestsSequentially
 */
async function executeSingleTest(test) {
  const startTime = Date.now();

  try {
    let testResult;

    // Route to appropriate test workflow based on type
    switch (test.type) {
      case 'action': {
        testResult = await executeActionTestWorkflow(test.target, test.options);
        break;
      }

      case 'api': {
        testResult = await executeApiTestWorkflow(test.target, test.options);
        break;
      }

      case 'performance': {
        const performanceOptions = {
          ...test.options,
          scenario: test.scenario,
          timeout: test.timeout,
        };
        testResult = await executePerformanceTestWorkflow(test.target, performanceOptions);
        break;
      }

      default:
        throw new Error(`Unknown test type: ${test.type}`);
    }

    // Enhance result with test metadata
    return {
      ...test,
      success: testResult.success,
      result: testResult,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...test,
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check if test type is valid
 * @purpose Validate test type against supported test types
 * @param {string} testType - Test type to validate
 * @returns {boolean} True if test type is valid
 * @usedBy Test validation utilities
 */
function isValidTestType(testType) {
  const validTypes = ['action', 'api', 'performance'];
  return validTypes.includes(testType);
}

/**
 * Get available test types
 * @purpose List all supported test types
 * @returns {Array} Array of supported test type names
 * @usedBy Test configuration and help utilities
 */
function getAvailableTestTypes() {
  return ['action', 'api', 'performance'];
}

/**
 * Estimate test execution time
 * @purpose Provide time estimate for test execution
 * @param {Array} tests - Array of test configurations
 * @param {boolean} parallel - Whether tests will run in parallel
 * @returns {number} Estimated execution time in milliseconds
 * @usedBy Test planning utilities
 */
function estimateExecutionTime(tests, parallel) {
  if (tests.length === 0) return 0;

  const testTimes = tests.map((test) => test.timeout || 10000);

  if (parallel) {
    // Parallel execution time is the maximum test time plus overhead
    return Math.max(...testTimes) + 2000; // 2s overhead
  } else {
    // Sequential execution time is the sum of all test times plus overhead
    return testTimes.reduce((sum, time) => sum + time, 0) + tests.length * 100; // 100ms between tests
  }
}

module.exports = {
  // Test Suite Execution
  executeTestSuite,
  buildTestExecutionList,

  // Parallel Test Execution
  executeTestsInParallel,

  // Sequential Test Execution
  executeTestsSequentially,

  // Single Test Execution
  executeSingleTest,
  isValidTestType,
  getAvailableTestTypes,
  estimateExecutionTime,
};
