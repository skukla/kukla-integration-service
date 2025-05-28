#!/usr/bin/env node

/**
 * API Test Runner CLI
 * @module tests/api/run-tests
 */

const APITestRunner = require('./test-runner');

function showHelp() {
  console.log('Adobe Commerce Integration Service API Testing Tool');
  console.log();
  console.log('Usage:');
  console.log('  npm run test:api:v2 [endpoint] [options]');
  console.log();
  console.log('Arguments:');
  console.log('  endpoint              The endpoint to test (default: get-products)');
  console.log('                        Available endpoints: get-products, browse-files,');
  console.log('                        download-file, delete-file');
  console.log();
  console.log('Options:');
  console.log('  --prod               Run tests against production environment');
  console.log('  --help, -h           Show this help message');
  console.log();
  console.log('Environment Variables (required in .env):');
  console.log('  COMMERCE_URL               Commerce instance URL');
  console.log('  COMMERCE_ADMIN_USERNAME    Commerce admin username');
  console.log('  COMMERCE_ADMIN_PASSWORD    Commerce admin password');
  console.log();
  console.log('Examples:');
  console.log('  1. Test get-products in development:');
  console.log('    npm run test:api:v2');
  console.log();
  console.log('  2. Test browse-files in production:');
  console.log('    npm run test:api:v2 browse-files --prod');
  console.log();
  console.log('  3. Test download-file in development:');
  console.log('    npm run test:api:v2 download-file');
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const env = args.includes('--prod') ? 'prod' : 'dev';
const endpoint = args.find((arg) => !arg.startsWith('--')) || 'get-products';

// Validate endpoint
const validEndpoints = ['get-products', 'browse-files', 'download-file', 'delete-file'];
if (!validEndpoints.includes(endpoint)) {
  console.error(`Error: Invalid endpoint '${endpoint}'`);
  console.error(`Valid endpoints are: ${validEndpoints.join(', ')}`);
  process.exit(1);
}

async function main() {
  try {
    console.log(`Running API tests for ${endpoint} in ${env} environment...`);

    const runner = new APITestRunner(env);
    const results = await runner.runAllTests(endpoint);

    // Calculate total results
    const totals = {
      passed: 0,
      failed: 0,
    };

    for (const type of ['basic', 'errors', 'edge']) {
      totals.passed += results[type].passed;
      totals.failed += results[type].failed;
    }

    console.log('\nOverall Results:');
    console.log('================');
    console.log(`Total Passed: ${totals.passed}`);
    console.log(`Total Failed: ${totals.failed}`);

    // Exit with appropriate status code
    process.exit(totals.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

main();
