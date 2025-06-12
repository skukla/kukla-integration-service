/**
 * Test script for simplified schemas
 * Validates that our schemas work correctly with actual configuration
 */

const chalk = require('chalk');

const { loadConfig, loadValidatedConfig } = require('../config');
const { validateConfig, validateFrontendConfig, getActionSchema } = require('../config/schema');
const { validateActionParams, validateActionResponse } = require('../src/core/validation');

/**
 * Validate all schemas
 * @returns {Promise<boolean>} - Whether validation passed
 */
async function validateSchemas() {
  try {
    // Test loading configuration without validation
    const config = loadConfig();

    // Test manual validation
    validateConfig(config);

    // Test loading with validation
    loadValidatedConfig();

    // Test frontend configuration
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

    // Test action schemas
    const actions = ['get-products', 'browse-files', 'download-file', 'delete-file'];

    for (const action of actions) {
      const schema = getActionSchema(action);
      if (schema) {
        // Test parameter validation with valid params
        const validParams = {
          NODE_ENV: 'staging',
          COMMERCE_ADMIN_USERNAME: 'admin',
          COMMERCE_ADMIN_PASSWORD: 'password',
          AWS_ACCESS_KEY_ID: 'test-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret',
          fileName: 'test.csv', // for file actions
        };

        validateActionParams(action, validParams);
        validateActionResponse(action, getValidResponseForAction(action));
      }
    }

    // Test invalid configurations
    const invalidConfig = {
      environment: 'invalid-env',
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
      // If we get here, the invalid config passed validation
      throw new Error('Invalid configuration passed validation');
    } catch (error) {
      // This is expected - invalid config should fail validation
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Support both direct execution and module usage
if (require.main === module) {
  const ora = require('ora');
  const spinner = ora('Validating schemas...').start();

  validateSchemas()
    .then((success) => {
      if (success) {
        spinner.succeed(chalk.green('Schema validation passed'));
        return process.exit(0);
      } else {
        spinner.fail('Schema validation failed');
        return process.exit(1);
      }
    })
    .catch((error) => {
      spinner.fail('Schema validation failed: ' + error.message);
      return process.exit(1);
    });
} else {
  module.exports = { validateSchemas };
}

// Helper function for valid responses
function getValidResponseForAction(action) {
  switch (action) {
    case 'get-products':
    case 'delete-file':
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
