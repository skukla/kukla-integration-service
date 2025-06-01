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
    env: 'local', // --env <environment>
    verbose: false, // --verbose
  },
});

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
  const spinner = ora('Running performance tests').start();
  const tester = createPerformanceTester({
    environment: options.env || args.env,
    logLevel: options.verbose || args.verbose ? 'debug' : 'info',
  });

  try {
    // Run tests for each scenario
    for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
      spinner.text = `Testing scenario: ${scenario.name}`;

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
        spinner.succeed(`Scenario ${name} passed`);
      } else {
        spinner.fail(`Scenario ${name} failed: ${results.error}`);
        if (results.metrics) {
          spinner.info('Performance metrics:');
          console.log(JSON.stringify(results.metrics, null, 2));
        }
      }
    }

    const finalResults = await tester.getResults();
    spinner.info('Performance test results:');
    console.log(JSON.stringify(finalResults, null, 2));
  } catch (error) {
    spinner.fail(`Test execution failed: ${error.message}`);
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
