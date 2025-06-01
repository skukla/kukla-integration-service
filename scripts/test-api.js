#!/usr/bin/env node

/**
 * Consolidated test script for all API endpoints
 */

const ora = require('ora');

const { getProducts } = require('../actions/backend/get-products/lib/api/products');
const { loadConfig } = require('../config');
const { getAuthToken } = require('../src/commerce/api/integration');

require('dotenv').config();

// Load configuration with proper destructuring
const {
  url: {
    commerce: { baseUrl: COMMERCE_URL },
  },
  commerce: {
    product: {
      pagination: { pageSize: DEFAULT_PAGE_SIZE },
      fields: PRODUCT_FIELDS,
    },
  },
} = loadConfig();

console.log('Commerce URL:', COMMERCE_URL);

/**
 * Tests a specific API endpoint
 * @param {Object} config - Test configuration
 * @returns {Promise<Object>} Test results
 */
async function testEndpoint(config) {
  try {
    console.log('Using config:', config);

    // Get auth token using URL from config but credentials from env
    const token = await getAuthToken({
      COMMERCE_URL: COMMERCE_URL, // Use URL from config
      COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
    });

    console.log('Got auth token:', token ? 'yes' : 'no');

    // Test the endpoint using URL from config
    const response = await getProducts(token, {
      COMMERCE_URL: COMMERCE_URL, // Use URL from config
      pageSize: config.pageSize,
      fields: PRODUCT_FIELDS, // Use fields from config
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Runs API tests
 * @param {Object} options - Test options
 */
async function runTests(options = {}) {
  const spinner = ora('Running API tests').start();

  try {
    const testConfig = {
      baseUrl: COMMERCE_URL, // Always use URL from config
      pageSize: options.pageSize || DEFAULT_PAGE_SIZE,
    };

    // Run the tests
    const results = await testEndpoint(testConfig);

    if (results.success) {
      spinner.succeed('API tests passed');
      console.log('Test results:', JSON.stringify(results.data, null, 2));
    } else {
      spinner.fail(`API tests failed: ${results.error}`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testEndpoint, // Export for testing
};
