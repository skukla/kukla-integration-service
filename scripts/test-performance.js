#!/usr/bin/env node

/**
 * Performance test runner
 */

const { loadConfig } = require('../config');
const { parseArgs } = require('../src/core/cli/args');
const { createPerformanceTester } = require('../src/core/testing/performance');

// Parse command line arguments
const args = parseArgs(process.argv.slice(2), {
  flags: {
    env: 'local', // --env <environment>
    verbose: false, // --verbose
  },
});

async function main() {
  const config = loadConfig().performance;
  const tester = createPerformanceTester({
    ...config,
    environment: args.env,
    logLevel: args.verbose ? 'debug' : 'info',
  });

  try {
    const results = await tester.runTests();
    console.log('Performance test results:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

main();
