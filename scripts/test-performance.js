#!/usr/bin/env node

/**
 * Performance testing script
 */

const ora = require('ora');

const { loadConfig } = require('../config');
const { parseArgs } = require('../src/core/cli/args');
const { createPerformanceTester, testScenario } = require('../src/core/testing/performance');

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

// Load configuration with proper destructuring
const {
  testing: {
    performance: {
      scenarios: TEST_SCENARIOS,
      thresholds: {
        executionTime: EXECUTION_THRESHOLD,
        memory: MEMORY_THRESHOLD,
        products: PRODUCTS_THRESHOLD,
        categories: CATEGORIES_THRESHOLD,
        compression: COMPRESSION_THRESHOLD,
        responseTime: { p95: P95_THRESHOLD, p99: P99_THRESHOLD },
        errorRate: ERROR_RATE_THRESHOLD,
      },
      baseline: { maxAgeDays: MAX_AGE_DAYS },
    },
  },
} = loadConfig();

/**
 * Runs performance tests
 * @param {Object} options - Test options
 */
async function runTests(options = {}) {
  const spinner = ora(`Running performance tests on ${environment}`).start();
  const tester = createPerformanceTester({
    environment: options.env || environment,
    workspace: workspaceName,
    logLevel: options.verbose || args.verbose ? 'debug' : 'info',
  });

  try {
    // Run tests for each scenario
    for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
      spinner.text = `Testing scenario: ${scenario.name} on ${environment}`;

      const results = await testScenario(scenario, {
        thresholds: {
          executionTime: EXECUTION_THRESHOLD,
          memory: MEMORY_THRESHOLD,
          products: PRODUCTS_THRESHOLD,
          categories: CATEGORIES_THRESHOLD,
          compression: COMPRESSION_THRESHOLD,
          responseTime: {
            p95: P95_THRESHOLD,
            p99: P99_THRESHOLD,
          },
          errorRate: ERROR_RATE_THRESHOLD,
        },
        maxAgeDays: MAX_AGE_DAYS,
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
