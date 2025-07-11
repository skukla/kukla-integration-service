/**
 * Test Domain - Orchestration Operations
 * Business operations for test orchestration
 */

const format = require('../../core/formatting');
const { actionTestingWorkflow } = require('../workflows/action-testing');
const { apiTestingWorkflow } = require('../workflows/api-testing');
const { performanceTestingWorkflow } = require('../workflows/performance-testing');

/**
 * Available test suites
 */
const TEST_SUITES = {
  smoke: {
    name: 'Smoke Test Suite',
    description: 'Quick validation of core functionality',
    tests: [
      { type: 'action', target: 'get-products' },
      { type: 'api', target: 'get-products' },
    ],
  },
  regression: {
    name: 'Regression Test Suite',
    description: 'Comprehensive functionality and performance testing',
    tests: [
      { type: 'action', target: 'get-products' },
      { type: 'action', target: 'browse-files' },
      { type: 'api', target: 'get-products' },
      { type: 'performance', target: 'get-products', scenario: 'quick' },
    ],
  },
  performance: {
    name: 'Performance Test Suite',
    description: 'Load and stress testing scenarios',
    tests: [
      { type: 'performance', target: 'get-products', scenario: 'baseline' },
      { type: 'performance', target: 'get-products', scenario: 'load' },
      { type: 'performance', target: 'browse-files', scenario: 'quick' },
    ],
  },
};

/**
 * Get available test suites
 * @returns {Array<string>} Available suite names
 */
function getAvailableSuites() {
  return Object.keys(TEST_SUITES);
}

/**
 * Get suite configuration
 * @param {string} suiteName - Suite name
 * @returns {Object|null} Suite configuration or null if not found
 */
function getSuite(suiteName) {
  return TEST_SUITES[suiteName] || null;
}

/**
 * Display available test suites with beautiful formatting
 */
function displayTestSuites() {
  console.log(format.section('🧪 Available Test Suites:'));
  console.log();

  Object.entries(TEST_SUITES).forEach(([key, suite]) => {
    console.log(format.info(`${key}: ${suite.name}`));
    console.log(format.muted(`   ${suite.description}`));
    console.log(format.muted(`   ${suite.tests.length} tests included`));
    console.log();
  });
}

/**
 * Execute a single test based on type
 * @param {Object} test - Test configuration
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function executeOrchestrationTest(test, options = {}) {
  const { type, target, scenario = 'quick' } = test;
  const { params = {}, isProd = false } = options;

  switch (type) {
    case 'action':
      return await actionTestingWorkflow(target, { params, isProd });

    case 'api':
      return await apiTestingWorkflow(target, { params, isProd });

    case 'performance':
      return await performanceTestingWorkflow(target, scenario, { params, isProd });

    default:
      return {
        success: false,
        error: `Unknown test type: ${type}`,
        target,
      };
  }
}

/**
 * Execute test suite with progress tracking
 * @param {Object} suite - Suite configuration
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Suite execution result
 */
async function executeTestSuite(suite, options = {}) {
  const { params = {}, isProd = false, failFast = false } = options;
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < suite.tests.length; i++) {
    const test = suite.tests[i];
    const testNumber = i + 1;

    console.log(
      format.info(
        `📋 Test ${testNumber}/${suite.tests.length}: ${test.type.toUpperCase()} - ${test.target}`
      )
    );
    if (test.scenario) {
      console.log(format.muted(`   Scenario: ${test.scenario}`));
    }
    console.log();

    const result = await executeOrchestrationTest(test, { params, isProd });
    results.push({
      ...result,
      testNumber,
      testType: test.type,
      testTarget: test.target,
    });

    if (result.success) {
      passed++;
      console.log(format.success(`✅ Test ${testNumber} passed`));
    } else {
      failed++;
      console.log(format.error(`❌ Test ${testNumber} failed: ${result.error || 'Unknown error'}`));

      if (failFast) {
        console.log(format.warning('🛑 Stopping due to fail-fast mode'));
        break;
      }
    }

    console.log();
    console.log('─'.repeat(60));
    console.log();
  }

  return {
    results,
    passed,
    failed,
  };
}

/**
 * Display test suite results with beautiful formatting
 * @param {Object} suiteResult - Suite execution result
 */
function displaySuiteResults(suiteResult) {
  const { results, passed, failed } = suiteResult;
  const total = results.length;
  const successRate = (passed / total) * 100;
  const overallSuccess = failed === 0;

  console.log();
  console.log(format.section('📊 Test Orchestration Summary:'));
  console.log();

  if (overallSuccess) {
    console.log(format.success(`🎉 All tests passed! (${passed}/${total})`));
  } else {
    console.log(format.warning(`⚠️  ${passed}/${total} tests passed (${successRate.toFixed(1)}%)`));
    console.log(format.error(`   ${failed} tests failed`));
  }

  console.log();
  console.log(format.section('Test Results:'));
  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    const testInfo = `${result.testType} - ${result.testTarget}`;
    console.log(format.muted(`   ${status} Test ${result.testNumber}: ${testInfo}`));
  });
}

module.exports = {
  getAvailableSuites,
  getSuite,
  displayTestSuites,
  executeOrchestrationTest,
  executeTestSuite,
  displaySuiteResults,
};
