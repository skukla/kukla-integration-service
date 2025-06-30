#!/usr/bin/env node

/**
 * Performance testing script
 */

const ora = require('ora');

const { loadConfig } = require('../config');
const { parseArgs } = require('../src/core/cli/args');
const { createPerformanceTester, testScenario } = require('../src/core/testing/performance');

/**
 * Gets performance testing configuration
 * @returns {Object} Performance test configuration
 */
function getPerformanceConfig() {
  const config = loadConfig();
  return {
    scenarios: config.testing.performance.scenarios,
    thresholds: config.testing.performance.thresholds,
    baseline: config.testing.performance.baseline,
  };
}

// Parse command line arguments
const args = parseArgs(process.argv.slice(2), {
  flags: {
    env: 'staging', // --env <environment> (staging or prod)
    verbose: false, // --verbose
  },
});

// Validate environment and map to Adobe I/O workspace names
const environmentMap = {
  staging: 'Stage',
  prod: 'Production',
};

const environment = args.env;
const validEnvironments = Object.keys(environmentMap);

if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Get the actual workspace name for Adobe I/O
const workspaceName = environmentMap[environment];

// Configuration will be loaded dynamically when needed

/**
 * Runs performance tests
 * @param {Object} options - Test options
 */
async function runTests(options = {}) {
  const spinner = ora(`Running performance tests on ${environment}`).start();

  // Load configuration dynamically
  const config = getPerformanceConfig();

  const tester = createPerformanceTester({
    environment: options.env || environment,
    workspace: workspaceName,
    logLevel: options.verbose || args.verbose ? 'debug' : 'info',
  });

  try {
    // Run tests for each scenario
    for (const [name, scenario] of Object.entries(config.scenarios)) {
      spinner.text = `Testing scenario: ${scenario.name} on ${environment}`;

      const results = await testScenario(scenario, {
        thresholds: config.thresholds,
        maxAgeDays: config.baseline.maxAgeDays,
      });

      if (results.passed) {
        spinner.succeed(`Scenario ${name} passed on ${environment}`);
      } else {
        spinner.fail(`Scenario ${name} failed on ${environment}: ${results.error}`);
        if (results.metrics) {
          spinner.info('Performance metrics:');
          console.log(JSON.stringify(results.metrics, null, 2));
        }
      }
    }

    const finalResults = await tester.getResults();
    spinner.info(`Performance test results for ${environment}:`);
    console.log(JSON.stringify(finalResults, null, 2));
  } catch (error) {
    spinner.fail(`Test execution failed on ${environment}: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
};
