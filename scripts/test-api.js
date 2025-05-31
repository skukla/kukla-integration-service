#!/usr/bin/env node

/**
 * Consolidated test script for all API endpoints
 */

const { loadConfig } = require('../config');
const {
  request: browseFilesRequestSchema,
  response: browseFilesResponseSchema,
} = require('../config/schema/api/browse-files.schema');
const {
  request: downloadFileRequestSchema,
  response: downloadFileResponseSchema,
} = require('../config/schema/api/download-file.schema');
const {
  request: getProductsRequestSchema,
  response: getProductsResponseSchema,
} = require('../config/schema/api/get-products.schema');
const { parseArgs } = require('../src/core/cli/args');
const { tests } = require('../src/core/testing/api');
const { defaultConfig } = require('../src/core/testing/config');
require('dotenv').config();

// Parse command line arguments
const args = parseArgs(process.argv.slice(2), {
  flags: {
    endpoint: '', // --endpoint <n>
    verbose: false, // --verbose
  },
});

// Convert string 'verbose' from colon notation to boolean
if (args.verbose === 'verbose') {
  args.verbose = true;
}

async function testGetProducts(config) {
  console.log('\n📦 Testing get-products API...');

  try {
    // Test with default configuration
    console.log('\n🧪 Testing get-products with default configuration...');
    const result = await tests.products({
      fields: defaultConfig.products.defaultFields,
      COMMERCE_URL: config.url.commerce.baseUrl,
      COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
      LOG_LEVEL: args.verbose ? 'debug' : 'info',
      env: 'dev',
      schema: {
        request: getProductsRequestSchema,
        response: getProductsResponseSchema,
      },
    });

    // Show trace output if available
    if (result.trace) {
      console.log('\n📊 Test Execution Trace:');
      console.log(JSON.stringify(result.trace, null, 2));
    }

    // Show response if available
    if (result.response && result.response.body) {
      console.log('\n📄 Response:');
      console.log(JSON.stringify(result.response.body, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    // Show trace output from error if available
    if (error.trace) {
      console.log('\n📊 Error Trace:');
      console.log(JSON.stringify(error.trace, null, 2));
    }

    // Show response if available
    if (error.response && error.response.body) {
      console.log('\n📄 Error Response:');
      console.log(JSON.stringify(error.response.body, null, 2));
    }

    throw error;
  }
}

async function testBrowseFiles(config) {
  console.log('\n📂 Testing browse-files API...');

  try {
    // Test browsing root directory
    console.log('\n🧪 Testing browse-files with root directory...');
    const result = await tests.browseFiles({
      params: {
        COMMERCE_URL: config.url.commerce.baseUrl,
        COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
        COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
        LOG_LEVEL: args.verbose ? 'debug' : 'info',
        env: 'dev',
      },
      schema: {
        request: browseFilesRequestSchema,
        response: browseFilesResponseSchema,
      },
    });

    // Show trace output if available
    if (result.trace) {
      console.log('\n📊 Test Execution Trace:');
      console.log(JSON.stringify(result.trace, null, 2));
    }

    // Test browsing specific directory with filter
    console.log('\n🧪 Testing browse-files with specific path and filter...');
    const result2 = await tests.browseFiles({
      params: {
        path: '/exports',
        filter: '*.csv',
        COMMERCE_URL: config.url.commerce.baseUrl,
        COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
        COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
        LOG_LEVEL: args.verbose ? 'debug' : 'info',
        env: 'dev',
      },
      schema: {
        request: browseFilesRequestSchema,
        response: browseFilesResponseSchema,
      },
    });

    // Show trace output if available
    if (result2.trace) {
      console.log('\n📊 Test Execution Trace:');
      console.log(JSON.stringify(result2.trace, null, 2));
    }
  } catch (error) {
    // Show trace output from error if available
    if (error.trace) {
      console.log('\n📊 Error Trace:');
      console.log(JSON.stringify(error.trace, null, 2));
    }
    throw error;
  }
}

async function testDownloadFile(config) {
  console.log('\n📥 Testing download-file API...');

  try {
    // Test downloading a file in raw format
    console.log('\n🧪 Testing download-file with raw format...');
    const result = await tests.downloadFile('test.csv', {
      params: {
        format: 'raw',
        COMMERCE_URL: config.url.commerce.baseUrl,
        COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
        COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
        LOG_LEVEL: args.verbose ? 'debug' : 'info',
        env: 'dev',
      },
      schema: {
        request: downloadFileRequestSchema,
        response: downloadFileResponseSchema,
      },
    });

    // Show trace output if available
    if (result.trace) {
      console.log('\n📊 Test Execution Trace:');
      console.log(JSON.stringify(result.trace, null, 2));
    }

    // Test downloading a file in base64 format
    console.log('\n🧪 Testing download-file with base64 format...');
    const result2 = await tests.downloadFile('test.csv', {
      params: {
        format: 'base64',
        COMMERCE_URL: config.url.commerce.baseUrl,
        COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
        COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
        LOG_LEVEL: args.verbose ? 'debug' : 'info',
        env: 'dev',
      },
      schema: {
        request: downloadFileRequestSchema,
        response: downloadFileResponseSchema,
      },
    });

    // Show trace output if available
    if (result2.trace) {
      console.log('\n📊 Test Execution Trace:');
      console.log(JSON.stringify(result2.trace, null, 2));
    }
  } catch (error) {
    // Show trace output from error if available
    if (error.trace) {
      console.log('\n📊 Error Trace:');
      console.log(JSON.stringify(error.trace, null, 2));
    }
    throw error;
  }
}

async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    // Run specific test based on argument or all tests
    if (args.endpoint === 'get-products') {
      await testGetProducts(config);
    } else if (args.endpoint === 'browse-files') {
      await testBrowseFiles(config);
    } else if (args.endpoint === 'download-file') {
      await testDownloadFile(config);
    } else if (!args.endpoint) {
      // Run all tests if no specific endpoint provided
      await testGetProducts(config);
      await testBrowseFiles(config);
      await testDownloadFile(config);
    } else {
      console.error(`\n❌ Unknown endpoint: ${args.endpoint}`);
      console.log('\nAvailable endpoints:');
      console.log('- get-products');
      console.log('- browse-files');
      console.log('- download-file');
      console.log('\nOptions:');
      console.log('--endpoint <n>  Test specific endpoint');
      console.log('--verbose         Enable debug logging');
      process.exit(1);
    }

    console.log('\n✅ All specified tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

main();
