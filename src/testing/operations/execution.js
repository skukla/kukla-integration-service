/**
 * Testing Execution Operations
 * Handles test execution with proper configuration
 */

const performanceTesting = require('../../../tools/testing/performance');
const { getTestingConfig } = require('../utils/config');

/**
 * Execute API endpoint test
 * @param {string} endpoint - Endpoint to test
 * @param {Object} params - Test parameters
 * @param {boolean} rawOutput - Whether to return raw output
 * @returns {Promise<Object>} Test result
 */
async function executeApiTest(endpoint, params, rawOutput) {
  const testConfig = getTestingConfig(params);
  const endpointPath = testConfig.endpoints[endpoint];

  if (!endpointPath) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  const fullUrl = testConfig.api.baseUrl + endpointPath;

  try {
    // eslint-disable-next-line no-console
    console.log('  Authenticating...');
    // eslint-disable-next-line no-console
    console.log('  Fetching products...');

    const response = await fetch(fullUrl, {
      method: 'GET',
      timeout: testConfig.api.timeout,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    if (rawOutput) {
      return data;
    }

    return { success: true, data, response };
  } catch (error) {
    throw new Error(`API endpoint ${endpoint} test failed: ${error.message}`);
  }
}

/**
 * Execute performance test
 * @param {string} scenarioName - Scenario to test
 * @param {Object} scenario - Scenario details
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function executePerformanceTest(scenarioName, scenario, options) {
  const { params = {}, rawOutput = false, environment = 'local', iterations = 1 } = options;

  // Use centralized testing configuration
  const testConfig = getTestingConfig(params);
  const config = {
    testing: {
      performance: testConfig.performance,
    },
  };

  // Merge scenario params with user params
  const testScenario = {
    ...scenario,
    params: { ...scenario.params, ...params },
  };

  const testOptions = {
    environment,
    iterations,
    includeAnalysis: scenario.analysis || false,
  };

  if (!rawOutput) {
    // eslint-disable-next-line no-console
    console.log(`\n🚀 Running performance test: ${scenario.name}`);
    // eslint-disable-next-line no-console
    console.log(`📋 Description: ${scenario.description}`);
    // eslint-disable-next-line no-console
    console.log(`🌍 Environment: ${environment}`);
    // eslint-disable-next-line no-console
    console.log(`🔄 Iterations: ${iterations}\n`);
  }

  const result = await performanceTesting.testScenario(config, testScenario, testOptions);

  return {
    success: result.passed,
    scenario: scenarioName,
    scenarioDetails: scenario,
    type: result.type,
    metrics: result.metrics,
    analysis: result.analysis,
    recommendations: result.recommendations,
    comparison: result.comparison,
    error: result.error,
    rawResponse: rawOutput ? result : undefined,
    message: result.passed
      ? `Performance test ${scenarioName} passed successfully`
      : `Performance test ${scenarioName} failed: ${result.error || 'Performance thresholds not met'}`,
  };
}

/**
 * Parse test command arguments into structured data
 * @param {Array} rawArgs - Raw CLI arguments
 * @returns {Object} Parsed command structure
 */
function parseTestCommandArgs(rawArgs) {
  const command = rawArgs[0];
  const target = rawArgs[1];
  const params = {};
  const options = {
    rawOutput: rawArgs.includes('--raw'),
    verbose: rawArgs.includes('--verbose'),
  };

  // Extract key=value parameters
  rawArgs.slice(2).forEach((arg) => {
    if (arg.includes('=') && !arg.startsWith('--')) {
      const [key, ...valueParts] = arg.split('=');
      const value = valueParts.join('=');
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    }
  });

  return { command, target, params, options };
}

/**
 * Route command to appropriate testing workflow
 * @param {string} command - Command to execute
 * @param {string} target - Target for the command
 * @param {Object} params - Command parameters
 * @param {Object} options - Command options
 * @returns {Promise<Object>} Test result
 */
async function routeTestCommand(command, target, params, options) {
  const apiTesting = require('../workflows/api-testing');
  const performanceTesting = require('../workflows/performance-testing');
  const actionTesting = require('../../../scripts/test/workflows/action-testing');

  switch (command) {
    case 'action':
      return await actionTesting.actionTestingWorkflow(target, {
        params,
        rawOutput: options.rawOutput,
      });
    case 'api':
      return await apiTesting.apiTestingWorkflow(target, {
        params,
        rawOutput: options.rawOutput,
      });
    case 'performance':
      return await performanceTesting.performanceTestingWorkflow(target, {
        params,
        rawOutput: options.rawOutput,
        environment: params.environment,
        iterations: params.iterations,
      });
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

module.exports = {
  executeApiTest,
  executePerformanceTest,
  parseTestCommandArgs,
  routeTestCommand,
};
