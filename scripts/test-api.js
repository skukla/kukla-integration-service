#!/usr/bin/env node

/**
 * Consolidated test script for all API endpoints
 */

const ora = require('ora');

const { loadConfig } = require('../config');
const { makeCommerceRequest } = require('../src/commerce/api/integration');
const { extractActionParams } = require('../src/shared/http/client');

require('dotenv').config();

/**
 * Gets test configuration
 * @returns {Object} Test configuration
 */
function getTestConfig() {
  const config = loadConfig();
  return {
    baseUrl: config.commerce.baseUrl,
    pageSize: config.products.perPage,
    fields: config.products.fields,
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  limit: parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1]) || 3,
};

// Configuration will be loaded dynamically when needed

/**
 * Formats product data for display
 * @param {Array} products - Product array
 * @param {Object} options - Display options
 * @returns {string} Formatted output
 */
function formatProductData(products, options) {
  if (!products || products.length === 0) {
    return 'No products found';
  }

  if (options.verbose) {
    // Full detailed output (original behavior)
    return JSON.stringify(products, null, 2);
  }

  // Default: Limited sample with key fields
  const limitedProducts = products.slice(0, options.limit).map((product) => ({
    sku: product.sku,
    name: product.name,
    price: product.price,
    qty: product.qty,
    media_count: product.media_gallery_entries?.length || 0,
  }));

  let output = `Showing ${limitedProducts.length} of ${products.length} products:\n`;
  output += JSON.stringify(limitedProducts, null, 2);

  if (products.length > options.limit) {
    output += `\n\n... and ${products.length - options.limit} more products`;
    output += '\n\nUse --verbose for full data, or --limit=N to show N products';
  }

  return output;
}

/**
 * Tests a specific API endpoint
 * @param {Object} config - Test configuration
 * @param {Object} spinner - Spinner instance for progress updates
 * @returns {Promise<Object>} Test results
 */
async function testEndpoint(config, spinner) {
  try {
    // Update spinner instead of console.log during execution
    spinner.text = 'Validating configuration...';

    // Pause spinner for config display
    spinner.stop();
    console.log('Using config:', config);

    // Resume spinner for API call
    spinner.start('Fetching products from Commerce API...');

    // Create action parameters for OAuth authentication
    const actionParams = extractActionParams({
      COMMERCE_CONSUMER_KEY: process.env.COMMERCE_CONSUMER_KEY,
      COMMERCE_CONSUMER_SECRET: process.env.COMMERCE_CONSUMER_SECRET,
      COMMERCE_ACCESS_TOKEN: process.env.COMMERCE_ACCESS_TOKEN,
      COMMERCE_ACCESS_TOKEN_SECRET: process.env.COMMERCE_ACCESS_TOKEN_SECRET,
    });

    // Test the endpoint using OAuth authentication (same as working actions)
    const endpoint = `/products?searchCriteria[pageSize]=${config.pageSize}&searchCriteria[currentPage]=1`;
    const requestOptions = {
      method: 'GET',
    };

    const response = await makeCommerceRequest(endpoint, requestOptions, actionParams);

    // Extract products from Commerce API response
    const products = response.body?.items || [];

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Runs API tests
 * @param {Object} testOptions - Test options
 */
async function runTests(testOptions = {}) {
  // Set quiet mode to suppress verbose API logging unless explicitly verbose
  if (!testOptions.verbose) {
    process.env.QUIET_MODE = 'true';
  }

  const spinner = ora('Initializing API test').start();

  try {
    // Load configuration dynamically
    const config = getTestConfig();

    console.log('Commerce URL:', config.baseUrl);

    const testConfig = {
      baseUrl: config.baseUrl,
      pageSize: config.pageSize,
    };

    // Run the tests
    const results = await testEndpoint(testConfig, spinner);

    if (results.success) {
      spinner.succeed('API tests passed');

      // Authentication was successful if we got data
      console.log('✓ Authentication: success (OAuth credentials validated)');
      console.log('✓ Product data:', `${results.data.length} products retrieved`);

      // Show formatted results
      console.log('\n' + formatProductData(results.data, testOptions));
    } else {
      spinner.fail(`API tests failed: ${results.error}`);
      console.log('\n❌ Check your OAuth credentials if this is an authentication error');
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Shows usage information
 */
function showUsage() {
  console.log(`
Usage: npm run test:api [options]

Options:
  --verbose, -v         Show full product data (warning: very long output)
  --limit=N             Show N products (default: 3)

Examples:
  npm run test:api                    # Show 3 products with key fields
  npm run test:api -- --limit=10     # Show 10 products  
  npm run test:api -- --verbose      # Show full data (very long)
`);
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run tests if called directly
if (require.main === module) {
  runTests(options);
}

module.exports = {
  runTests,
  testEndpoint, // Export for testing
};
