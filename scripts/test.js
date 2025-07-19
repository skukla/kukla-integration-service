#!/usr/bin/env node

/**
 * App Test - Feature Core
 * Complete application testing capability with organized sub-modules for different test types
 */

const { loadConfig } = require('../config');
const { parseTestArgs, displayHelp } = require('./shared/args');
const format = require('./shared/formatting');
const { executeActionTestWorkflow } = require('../src/testing/action-testing');
const { executeApiTestWorkflow } = require('../src/testing/api-testing');
const { executePerformanceTestWorkflow } = require('../src/testing/performance-testing');
const { executeTestSuiteWorkflow } = require('../src/testing/suite-testing');

// Business Workflows

/**
 * Complete application testing workflow with all test types
 * @purpose Execute comprehensive testing including actions, APIs, and performance tests
 * @param {string} testType - Type of test to run (action, api, performance, suite)
 * @param {string} target - Target action/endpoint/suite name
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Testing result with all components
 * @usedBy test CLI entry point
 */
async function testAppWithAllComponents(testType, target, options = {}) {
  try {
    console.log(format.info(`🧪 Starting ${testType} testing...`));
    console.log(format.muted(`Target: ${target}`));

    let result;

    // Step 1: Route to appropriate test workflow based on type
    switch (testType) {
      case 'action':
        result = await executeActionTestWorkflow(target, options);
        break;
      case 'api':
        result = await executeApiTestWorkflow(target, options);
        break;
      case 'performance':
        result = await executePerformanceTestWorkflow(target, options);
        break;
      case 'suite':
        result = await executeTestSuiteWorkflow(target, options);
        break;
      default:
        throw new Error(
          `Unknown test type: ${testType}. Valid types: action, api, performance, suite`
        );
    }

    // Step 2: Display results
    displayTestResults(result, testType);

    return result;
  } catch (error) {
    console.log(format.error(`Testing failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      testType,
      target,
    };
  }
}

/**
 * Standard testing workflow
 * @purpose Execute testing with standard configuration
 * @param {string} testType - Type of test to run
 * @param {string} target - Target to test
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Testing result
 * @usedBy Scripts requiring simplified test interface
 */
async function testApp(testType, target, options = {}) {
  return await testAppWithAllComponents(testType, target, options);
}

// Feature Operations

/**
 * Load testing configuration
 * @purpose Get complete configuration for testing operations
 * @param {Object} options - Configuration options
 * @returns {Object} Testing configuration
 * @usedBy All test workflows
 */
function loadTestingConfig(options = {}) {
  const { isProd = false } = options;
  return loadConfig({}, isProd);
}

/**
 * Build action URL for testing
 * @purpose Construct complete action URL with parameters
 * @param {string} actionName - Name of action
 * @param {Object} config - Testing configuration
 * @returns {string} Complete action URL
 * @usedBy executeActionTestWorkflow
 */
function buildActionUrl(actionName, config) {
  const { runtime } = config;
  return `${runtime.url}/api/v1/web/${runtime.namespace}/${runtime.package}/${actionName}`;
}

/**
 * Build API URL for testing
 * @purpose Construct API endpoint URL with parameters
 * @param {string} endpoint - API endpoint
 * @param {Object} config - Testing configuration
 * @returns {string} Complete API URL
 * @usedBy executeApiTestWorkflow
 */
function buildApiUrl(endpoint, config) {
  const { commerce } = config;
  return `${commerce.baseUrl}/rest/V1/${endpoint}`;
}

// Feature Utilities

/**
 * Display test results in user-friendly format
 * @purpose Format and display test results with appropriate colors and formatting
 * @param {Object} result - Test result to display
 * @param {string} testType - Type of test performed
 * @returns {void} Console output only
 * @usedBy testAppWithAllComponents
 */
function displayTestResults(result, testType) {
  console.log(`\n📊 ${testType.toUpperCase()} Test Results:`);

  if (result.success) {
    console.log(format.success(`✅ ${testType} test passed`));

    if (result.duration) {
      console.log(format.muted(`⏱️ Duration: ${result.duration}ms`));
    }

    if (result.details) {
      console.log('\nDetails:');
      if (Array.isArray(result.details)) {
        result.details.forEach((detail) => {
          console.log(format.muted(`  • ${detail}`));
        });
      } else {
        console.log(format.muted(`  ${result.details}`));
      }
    }
  } else {
    console.log(format.error(`❌ ${testType} test failed`));

    if (result.error) {
      console.log(format.error(`Error: ${result.error}`));
    }

    if (result.details) {
      console.log('\nFailure Details:');
      if (Array.isArray(result.details)) {
        result.details.forEach((detail) => {
          console.log(format.error(`  • ${detail}`));
        });
      } else {
        console.log(format.error(`  ${result.details}`));
      }
    }
  }
}

// CLI Integration
async function main() {
  const args = process.argv.slice(2);
  const options = parseTestArgs(args);

  if (options.help) {
    displayHelp(
      'test',
      'npm run test:<type> [target] [options]',
      [
        { flag: '--timeout <ms>', description: 'Request timeout (default: 10000)' },
        { flag: '--retries <n>', description: 'Number of retries (default: 3)' },
        { flag: '--scenario <name>', description: 'Performance scenario (quick, baseline, load)' },
      ],
      [
        { command: 'npm run test:action get-products', description: 'Test get-products action' },
        { command: 'npm run test:api products', description: 'Test products API' },
        { command: 'npm run test:performance get-products', description: 'Performance test' },
        { command: 'npm run test:suite smoke', description: 'Run smoke test suite' },
      ]
    );
    return;
  }

  const result = await testAppWithAllComponents(options.testType, options.target, options);
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testAppWithAllComponents,
  testApp,
  loadTestingConfig,
  buildActionUrl,
  buildApiUrl,
};
