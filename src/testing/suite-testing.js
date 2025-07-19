/**
 * Suite Testing
 * Complete test suite execution capability with predefined test combinations and multi-type orchestration
 */

const { executeActionTestWorkflow } = require('./action-testing');
const { executeApiTestWorkflow } = require('./api-testing');
const { executePerformanceTestWorkflow } = require('./performance-testing');

// Business Workflows

/**
 * Execute complete test suite workflow
 * @purpose Run predefined test suites with multiple test types and comprehensive reporting
 * @param {string} suiteName - Name of test suite to run (smoke, regression, comprehensive)
 * @param {Object} options - Suite test options including environment and reporting preferences
 * @returns {Promise<Object>} Complete test suite result with aggregated metrics
 * @usedBy scripts/test.js, automated testing pipelines
 * @config testing.suites, testing.expectations
 */
async function executeTestSuiteWorkflow(suiteName, options = {}) {
  try {
    // Step 1: Validate suite and load configuration
    const validationResult = validateTestSuiteInputs(suiteName, options);
    if (!validationResult.isValid) {
      return buildTestSuiteErrorResult(validationResult.error, suiteName);
    }

    // Step 2: Load suite configuration and build test plan
    const suiteConfig = loadTestSuiteConfiguration(suiteName);
    const testPlan = buildTestSuitePlan(suiteConfig, options);

    // Step 3: Execute test suite with orchestration
    const suiteResults = await executeTestSuiteTests(testPlan, options);

    // Step 4: Aggregate results and generate comprehensive report
    const aggregatedResults = aggregateTestSuiteResults(suiteResults, testPlan);

    return buildTestSuiteResult(suiteName, suiteResults, aggregatedResults, options);
  } catch (error) {
    return buildTestSuiteErrorResult(error, suiteName);
  }
}

/**
 * Execute test suite with custom configuration
 * @purpose Run custom test suite with specific test combinations
 * @param {Array} testConfigs - Array of test configurations
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Custom test suite result
 * @usedBy Advanced testing workflows that need custom test combinations
 */
async function executeCustomTestSuite(testConfigs, options = {}) {
  const customSuite = {
    name: 'custom',
    description: 'Custom test suite',
    tests: testConfigs,
  };

  const testPlan = buildTestSuitePlan(customSuite, options);
  const suiteResults = await executeTestSuiteTests(testPlan, options);
  const aggregatedResults = aggregateTestSuiteResults(suiteResults, testPlan);

  return buildTestSuiteResult('custom', suiteResults, aggregatedResults, options);
}

// Feature Operations

/**
 * Validate test suite inputs and configuration
 * @purpose Ensure suite name exists and options are valid
 * @param {string} suiteName - Suite name to validate
 * @param {Object} options - Options to validate
 * @returns {Object} Validation result with isValid flag and error details
 */
function validateTestSuiteInputs(suiteName, options) {
  const validSuites = ['smoke', 'regression', 'comprehensive', 'performance', 'quick'];

  if (!suiteName || typeof suiteName !== 'string') {
    return { isValid: false, error: 'Suite name is required and must be a string' };
  }

  if (!validSuites.includes(suiteName)) {
    return {
      isValid: false,
      error: `Unknown suite: ${suiteName}. Valid suites: ${validSuites.join(', ')}`,
    };
  }

  if (options.timeout && (typeof options.timeout !== 'number' || options.timeout < 5000)) {
    return { isValid: false, error: 'Suite timeout must be a number >= 5000ms' };
  }

  return { isValid: true };
}

/**
 * Load predefined test suite configuration
 * @purpose Get suite configuration with test definitions and expectations
 * @param {string} suiteName - Name of suite to load
 * @returns {Object} Suite configuration with tests and metadata
 */
function loadTestSuiteConfiguration(suiteName) {
  const suiteConfigurations = {
    smoke: {
      name: 'Smoke Tests',
      description: 'Basic functionality verification',
      timeout: 30000,
      tests: [{ type: 'action', target: 'get-products', timeout: 10000 }],
    },
    regression: {
      name: 'Regression Tests',
      description: 'Comprehensive functionality testing',
      timeout: 120000,
      tests: [
        { type: 'action', target: 'get-products', timeout: 15000 },
        { type: 'action', target: 'get-products-mesh', timeout: 15000 },
        { type: 'action', target: 'browse-files', timeout: 10000 },
        { type: 'api', target: 'products', timeout: 10000 },
        { type: 'api', target: 'categories', timeout: 10000 },
      ],
    },
    comprehensive: {
      name: 'Comprehensive Tests',
      description: 'Full system testing including performance',
      timeout: 300000,
      tests: [
        { type: 'action', target: 'get-products', timeout: 15000 },
        { type: 'action', target: 'get-products-mesh', timeout: 15000 },
        { type: 'action', target: 'browse-files', timeout: 10000 },
        { type: 'action', target: 'download-file', timeout: 10000 },
        { type: 'action', target: 'delete-file', timeout: 10000 },
        { type: 'api', target: 'products', timeout: 10000 },
        { type: 'api', target: 'categories', timeout: 10000 },
        { type: 'performance', target: 'get-products', scenario: 'baseline', timeout: 20000 },
      ],
    },
    performance: {
      name: 'Performance Tests',
      description: 'Performance and load testing',
      timeout: 180000,
      tests: [
        { type: 'performance', target: 'get-products', scenario: 'baseline', timeout: 20000 },
        { type: 'performance', target: 'get-products-mesh', scenario: 'baseline', timeout: 20000 },
        { type: 'performance', target: 'products-api', scenario: 'load', timeout: 30000 },
      ],
    },
    quick: {
      name: 'Quick Tests',
      description: 'Fast verification for development',
      timeout: 15000,
      tests: [{ type: 'action', target: 'get-products', timeout: 8000 }],
    },
  };

  return suiteConfigurations[suiteName] || suiteConfigurations.quick;
}

/**
 * Build executable test plan from suite configuration
 * @purpose Create detailed execution plan with timing and dependencies
 * @param {Object} suiteConfig - Suite configuration
 * @param {Object} options - Execution options
 * @returns {Object} Executable test plan
 */
function buildTestSuitePlan(suiteConfig, options) {
  return {
    name: suiteConfig.name,
    description: suiteConfig.description,
    tests: suiteConfig.tests,
    timeout: options.timeout || suiteConfig.timeout,
    parallel: options.parallel !== false,
    environment: options.isProd ? 'production' : 'staging',
    startTime: Date.now(),
    expectedDuration: suiteConfig.tests.reduce((sum, test) => sum + test.timeout, 0),
  };
}

/**
 * Execute all tests in test suite plan
 * @purpose Run suite tests with proper coordination and error handling
 * @param {Object} testPlan - Test plan to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Suite execution results
 */
async function executeTestSuiteTests(testPlan, options) {
  const results = {
    individual: [],
    startTime: testPlan.startTime,
    endTime: null,
    totalTests: testPlan.tests.length,
  };

  // Execute tests based on parallel/serial preference
  if (testPlan.parallel && testPlan.tests.length > 1) {
    results.individual = await executeTestsInParallel(testPlan.tests, options);
  } else {
    results.individual = await executeTestsSequentially(testPlan.tests, options);
  }

  results.endTime = Date.now();
  return results;
}

/**
 * Execute tests in parallel with proper concurrency control
 * @purpose Run multiple tests simultaneously while managing resources
 * @param {Array} tests - Array of test configurations
 * @param {Object} options - Execution options
 * @returns {Promise<Array>} Array of test results
 */
async function executeTestsInParallel(tests, options) {
  const maxConcurrency = Math.min(tests.length, 3);
  const results = [];

  for (let i = 0; i < tests.length; i += maxConcurrency) {
    const batch = tests.slice(i, i + maxConcurrency);
    const batchPromises = batch.map((test) => executeSingleTestInSuite(test, options));
    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((settledResult, index) => {
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value);
      } else {
        results.push({
          success: false,
          type: batch[index].type,
          target: batch[index].target,
          error: settledResult.reason.message,
          executedAt: new Date().toISOString(),
        });
      }
    });
  }

  return results;
}

/**
 * Execute tests sequentially with comprehensive error handling
 * @purpose Run tests one after another with proper error recovery
 * @param {Array} tests - Array of test configurations
 * @param {Object} options - Execution options
 * @returns {Promise<Array>} Array of test results
 */
async function executeTestsSequentially(tests, options) {
  const results = [];

  for (const test of tests) {
    try {
      const result = await executeSingleTestInSuite(test, options);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        type: test.type,
        target: test.target,
        error: error.message,
        executedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Execute single test within suite context
 * @purpose Route individual test execution to appropriate handler
 * @param {Object} test - Test configuration
 * @param {Object} options - Suite execution options
 * @returns {Promise<Object>} Individual test result
 */
async function executeSingleTestInSuite(test, options) {
  const testOptions = {
    isProd: options.isProd,
    timeout: test.timeout,
    verbose: options.verbose,
    rawOutput: false, // Suite testing needs structured results
  };

  switch (test.type) {
    case 'action':
      return await executeActionTestWorkflow(test.target, testOptions);

    case 'api':
      return await executeApiTestWorkflow(test.target, testOptions);

    case 'performance':
      return await executePerformanceTestWorkflow(test.target, {
        ...testOptions,
        scenario: test.scenario || 'quick',
      });

    default:
      throw new Error(`Unknown test type in suite: ${test.type}`);
  }
}

/**
 * Aggregate individual test results into suite metrics
 * @purpose Calculate overall suite performance and success metrics
 * @param {Object} suiteResults - Individual test results
 * @param {Object} testPlan - Original test plan
 * @returns {Object} Aggregated suite metrics
 */
function aggregateTestSuiteResults(suiteResults, testPlan) {
  const { individual, startTime, endTime, totalTests } = suiteResults;

  const successfulTests = individual.filter((result) => result.success);
  const failedTests = individual.filter((result) => !result.success);

  return {
    totalTests,
    successfulTests: successfulTests.length,
    failedTests: failedTests.length,
    successRate: totalTests > 0 ? successfulTests.length / totalTests : 0,
    suiteDuration: endTime - startTime,
    expectedDuration: testPlan.expectedDuration,
    averageTestDuration:
      individual.length > 0
        ? individual.reduce((sum, r) => sum + (r.duration || 0), 0) / individual.length
        : 0,
    overallSuccess: failedTests.length === 0,
    suiteEfficiency:
      testPlan.expectedDuration > 0 ? (endTime - startTime) / testPlan.expectedDuration : 1,
  };
}

// Feature Utilities

/**
 * Build comprehensive test suite result
 * @purpose Create standardized suite result with all metrics and details
 * @param {string} suiteName - Name of executed suite
 * @param {Object} suiteResults - Raw execution results
 * @param {Object} aggregatedResults - Calculated metrics
 * @param {Object} options - Original execution options
 * @returns {Object} Complete test suite result
 */
function buildTestSuiteResult(suiteName, suiteResults, aggregatedResults, options) {
  return {
    success: aggregatedResults.overallSuccess,
    suiteName,
    description: `Test suite execution for ${suiteName}`,
    metrics: aggregatedResults,
    individual: suiteResults.individual,
    duration: aggregatedResults.suiteDuration,
    executedAt: new Date().toISOString(),
    environment: options.isProd ? 'production' : 'staging',
    details: aggregatedResults.overallSuccess
      ? [
          `Suite ${suiteName}: ${aggregatedResults.successfulTests}/${aggregatedResults.totalTests} tests passed in ${aggregatedResults.suiteDuration}ms`,
        ]
      : [
          `Suite ${suiteName}: ${aggregatedResults.failedTests}/${aggregatedResults.totalTests} tests failed`,
        ],
  };
}

/**
 * Build test suite error result
 * @purpose Create standardized error result for suite failures
 * @param {Error|string} error - Error that occurred during suite execution
 * @param {string} suiteName - Name of suite that was being executed
 * @returns {Object} Standardized error result
 */
function buildTestSuiteErrorResult(error, suiteName) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return {
    success: false,
    suiteName,
    error: errorMessage,
    details: [errorMessage],
    executedAt: new Date().toISOString(),
  };
}

module.exports = {
  // Business workflows (main exports that scripts import)
  executeTestSuiteWorkflow,
  executeCustomTestSuite,

  // Feature operations (available for extension and testing)
  validateTestSuiteInputs,
  loadTestSuiteConfiguration,
  buildTestSuitePlan,
  executeTestSuiteTests,
  aggregateTestSuiteResults,

  // Feature utilities (building blocks)
  buildTestSuiteResult,
  buildTestSuiteErrorResult,
};
