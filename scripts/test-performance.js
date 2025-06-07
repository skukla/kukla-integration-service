#!/usr/bin/env node

/**
 * Performance testing script
 */

const ora = require('ora');

const { parseArgs } = require('../src/core/cli/args');
const { createLazyConfigGetter } = require('../src/core/config/lazy-loader');
const { createPerformanceTester, testScenario } = require('../src/core/testing/performance');

/**
 * Lazy configuration getter for performance testing
 * @type {Function}
 */
const getPerformanceConfig = createLazyConfigGetter('performance-test-config', (config) => ({
  scenarios: config.testing?.performance?.scenarios || {},
  thresholds: {
    executionTime: config.testing?.performance?.thresholds?.executionTime || 5000,
    memory: config.testing?.performance?.thresholds?.memory || 100,
    products: config.testing?.performance?.thresholds?.products || 1000,
    categories: config.testing?.performance?.thresholds?.categories || 100,
    compression: config.testing?.performance?.thresholds?.compression || 50,
    responseTime: {
      p95: config.testing?.performance?.thresholds?.responseTime?.p95 || 2000,
      p99: config.testing?.performance?.thresholds?.responseTime?.p99 || 5000,
    },
    errorRate: config.testing?.performance?.thresholds?.errorRate || 0.05,
  },
  baseline: {
    maxAgeDays: config.testing?.performance?.baseline?.maxAgeDays || 30,
  },
}));

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
