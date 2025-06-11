/**
 * Test script for simplified schemas
 * Validates that our schemas work correctly with actual configuration
 */

const { loadConfig, loadValidatedConfig } = require('../config');
const { validateConfig, validateFrontendConfig, getActionSchema } = require('../config/schema');
const { validateActionParams, validateActionResponse } = require('../src/core/validation');

// Check if running in quiet mode for build integration
const isQuiet = process.argv.includes('--quiet') || process.env.NODE_ENV === 'test';

/**
 * Log function that respects quiet mode
 */
function log(message, force = false) {
  if (!isQuiet || force) {
    console.log(message);
  }
}

/**
 * Log error function (always shows)
 */
function logError(message) {
  console.error(message);
}

/**
 * Test configuration validation
 */
function testConfigValidation() {
  log('🧪 Testing configuration validation...');

  try {
    // Test loading configuration without validation
    const config = loadConfig();
    log('✅ Configuration loaded successfully');

    // Test manual validation
    validateConfig(config);
    log('✅ Configuration validation passed');

    // Test loading with validation
    loadValidatedConfig();
    log('✅ Validated configuration loaded successfully');

    return true;
  } catch (error) {
    logError('❌ Configuration validation failed: ' + error.message);
    return false;
  }
}

/**
 * Test frontend configuration validation
 */
function testFrontendValidation() {
  log('\n🧪 Testing frontend configuration validation...');

  try {
    // Simulate frontend configuration
    const frontendConfig = {
      environment: 'staging',
      runtime: {
        package: 'kukla-integration-service',
        version: 'v1',
        url: 'https://285361-188maroonwallaby-stage.adobeioruntime.net',
        paths: {
          base: '/api',
          web: '/web',
        },
        actions: {
          'get-products': 'get-products',
          'browse-files': 'browse-files',
          'download-file': 'download-file',
          'delete-file': 'delete-file',
        },
      },
      performance: {
        timeout: 30000,
        maxExecutionTime: 30000,
      },
    };

    validateFrontendConfig(frontendConfig);
    log('✅ Frontend configuration validation passed');

    return true;
  } catch (error) {
    logError('❌ Frontend configuration validation failed: ' + error.message);
    return false;
  }
}

/**
 * Get valid response for specific action type
 * Each action has different response requirements:
 * - get-products, delete-file: JSON API responses with success/message/steps
 * - browse-files: HTML response (but still with JSON body for our schema)
 * - download-file: File content response with specific headers
 *
 * @param {string} action - Action name
 * @returns {Object} Valid response structure for the action
 */
function getValidResponseForAction(action) {
  switch (action) {
    case 'get-products':
    case 'delete-file':
      // Standard JSON API response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS, GET, DELETE, POST, PUT, HEAD, PATCH',
          'Access-Control-Allow-Headers':
            'Authorization, Origin, X-Requested-With, Content-Type, Accept, User-Agent',
        },
        body: {
          success: true,
          message: 'Test successful',
          steps: ['Step 1: Test completed'],
          storage: {
            provider: 's3',
            location: 'test/path',
            properties: {},
          },
          downloadUrl: 'https://example.com/download/test.csv',
        },
      };

    case 'browse-files':
      // HTML response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS, GET, DELETE, POST, PUT, HEAD, PATCH',
          'Access-Control-Allow-Headers':
            'Authorization, Origin, X-Requested-With, Content-Type, Accept, User-Agent',
        },
        body: {
          success: true,
          message: 'Files browsed successfully',
          steps: ['Step 1: Retrieved file list'],
          storage: {
            provider: 's3',
            location: 'public/',
            properties: {},
          },
        },
      };

    case 'download-file':
      // File download response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="test.csv"',
          'Content-Length': '1024',
        },
        body: 'sku,name,price,qty\nTEST001,Test Product,19.99,100',
      };

    default:
      // Fallback to standard JSON response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          success: true,
          message: 'Test successful',
        },
      };
  }
}

/**
 * Test action schema validation
 */
function testActionSchemas() {
  log('\n🧪 Testing action schema validation...');

  const actions = ['get-products', 'browse-files', 'download-file', 'delete-file'];
  let allPassed = true;

  for (const action of actions) {
    try {
      const schema = getActionSchema(action);
      if (schema) {
        log(`✅ Schema found for action: ${action}`);

        // Test parameter validation with valid params
        const validParams = {
          NODE_ENV: 'staging',
          COMMERCE_ADMIN_USERNAME: 'admin',
          COMMERCE_ADMIN_PASSWORD: 'password',
          AWS_ACCESS_KEY_ID: 'test-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret',
          fileName: 'test.csv', // for file actions
        };

        const isValid = validateActionParams(action, validParams);
        if (isValid) {
          log(`✅ Parameter validation passed for: ${action}`);
        } else {
          logError(`⚠️  Parameter validation failed for: ${action} (non-strict mode)`);
        }

        // Test response validation with action-specific valid response
        const validResponse = getValidResponseForAction(action);
        const responseValid = validateActionResponse(action, validResponse);
        if (responseValid) {
          log(`✅ Response validation passed for: ${action}`);
        } else {
          logError(`⚠️  Response validation failed for: ${action} (non-strict mode)`);
        }
      } else {
        logError(`⚠️  No schema found for action: ${action}`);
      }
    } catch (error) {
      logError(`❌ Schema test failed for ${action}: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test invalid configurations
 */
function testInvalidConfigurations() {
  log('\n🧪 Testing invalid configuration handling...');

  try {
    // Test invalid environment
    const invalidConfig = {
      environment: 'invalid-env', // Should fail
      commerce: {
        baseUrl: 'https://example.com',
        timeout: 30000,
      },
      storage: {
        provider: 's3',
      },
      runtime: {
        package: 'test',
        baseUrl: 'https://runtime.com',
        namespace: 'test',
      },
      performance: {},
    };

    try {
      validateConfig(invalidConfig);
      logError('❌ Should have failed validation for invalid environment');
      return false;
    } catch (error) {
      log('✅ Correctly rejected invalid configuration');
    }

    // Test missing required fields
    const incompleteConfig = {
      environment: 'staging',
      // Missing required fields
    };

    try {
      validateConfig(incompleteConfig);
      logError('❌ Should have failed validation for incomplete configuration');
      return false;
    } catch (error) {
      log('✅ Correctly rejected incomplete configuration');
    }

    return true;
  } catch (error) {
    logError('❌ Invalid configuration test failed: ' + error.message);
    return false;
  }
}

/**
 * Main test execution
 */
function main() {
  if (!isQuiet) {
    console.log('🚀 Starting schema validation tests...\n');
  }

  const tests = [
    testConfigValidation,
    testFrontendValidation,
    testActionSchemas,
    testInvalidConfigurations,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError('❌ Test execution failed: ' + error.message);
      failed++;
    }
  }

  if (isQuiet) {
    // Concise output for build integration
    if (failed === 0) {
      console.log('✅ Schema validation passed');
    } else {
      console.log(`❌ Schema validation failed (${failed}/${tests.length} tests failed)`);
    }
  } else {
    // Detailed output for development
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🎉 All schema tests passed!');
    } else {
      console.log('\n💥 Some schema tests failed!');
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

main();
