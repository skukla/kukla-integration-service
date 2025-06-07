const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const yaml = require('js-yaml');
const fetch = require('node-fetch');
const ora = require('ora');

// Import URL building utilities
const { loadConfig } = require('../config');
const { buildRuntimeUrl } = require('../src/core/routing');

// Parse command line arguments
const args = process.argv.slice(2);
const actionName = args.find((arg) => !arg.startsWith('--') && !arg.includes('='));
const rawOutput = args.includes('--raw');

// Parse parameters in key=value format
const paramArgs = args.filter((arg) => arg.includes('=') && !arg.startsWith('--'));
const params = {};
paramArgs.forEach((param) => {
  const [key, ...valueParts] = param.split('=');
  const value = valueParts.join('='); // Handle values that contain '='

  // Try to parse as JSON for complex values, otherwise keep as string
  try {
    params[key] = JSON.parse(value);
  } catch {
    params[key] = value;
  }
});

/**
 * Process parameters for specific actions to provide better UX
 * @param {string} actionName - The action being called
 * @param {Object} params - Raw parameters object
 * @returns {Object} Processed parameters
 */
function processActionParameters(actionName, params) {
  const processedParams = { ...params };

  // For delete-file action, automatically prepend 'public/' to fileName if not already present
  if (actionName === 'delete-file' && processedParams.fileName) {
    if (!processedParams.fileName.startsWith('public/')) {
      processedParams.fileName = `public/${processedParams.fileName}`;
    }
  }

  // For get-products action, load Commerce URL from config and credentials from .env if not provided
  if (actionName === 'get-products') {
    // Load Commerce URL from environment configuration if not provided
    if (!processedParams.COMMERCE_URL) {
      try {
        const config = loadConfig();
        const commerceUrl = config.url?.commerce?.baseUrl;
        if (commerceUrl) {
          processedParams.COMMERCE_URL = commerceUrl;
        }
      } catch (error) {
        // Silently fail - user can provide URL manually
      }
    }

    // Load credentials from .env if not provided
    if (!processedParams.COMMERCE_ADMIN_USERNAME || !processedParams.COMMERCE_ADMIN_PASSWORD) {
      try {
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const envLines = envContent.split('\n');

          envLines.forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();

            if (key && value && !processedParams[key]) {
              processedParams[key] = value;
            }
          });
        }
      } catch (error) {
        // Silently fail - user can provide params manually
      }
    }
  }

  return processedParams;
}

if (!actionName) {
  console.error(chalk.red('Please provide an action name'));
  console.log(chalk.yellow('Usage: node test-action.js <action-name> [key=value ...] [--raw]'));
  console.log(chalk.yellow('Examples:'));
  console.log(chalk.cyan('  node test-action.js get-products'));
  console.log(chalk.cyan('  node test-action.js get-products COMMERCE_URL=https://demo.com'));
  console.log(chalk.cyan('  node test-action.js delete-file fileName=products.csv'));
  console.log(chalk.cyan('  node test-action.js browse-files modal=true'));
  console.log(chalk.yellow('Options:'));
  console.log(chalk.cyan('  --raw    Output raw JSON response only'));
  console.log(chalk.yellow('\nNotes:'));
  console.log(
    chalk.yellow(
      '  • For delete-file, fileName will automatically prepend "public/" if not present'
    )
  );
  console.log(
    chalk.yellow(
      '  • For get-products, Commerce credentials will be loaded from .env if not provided'
    )
  );
  console.log(
    chalk.yellow(
      '  • Required for get-products: COMMERCE_URL, COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    )
  );
  console.log(chalk.yellow('\nAvailable actions:'));
  const config = yaml.load(fs.readFileSync(path.join(__dirname, '../app.config.yaml'), 'utf8'));
  const actions = Object.keys(
    config.application.runtimeManifest.packages['kukla-integration-service'].actions
  );
  actions.forEach((action) => console.log(chalk.cyan(`  - ${action}`)));
  process.exit(1);
}

async function testAction(actionUrl, requestParams) {
  const hasParams = Object.keys(requestParams).length > 0;

  const fetchOptions = {
    method: hasParams ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (hasParams) {
    fetchOptions.body = JSON.stringify(requestParams);
  }

  const response = await fetch(actionUrl, fetchOptions);
  let responseData;

  // Get the response text first, then try to parse as JSON
  const text = await response.text();

  try {
    responseData = JSON.parse(text);
  } catch (error) {
    // Handle non-JSON responses (like HTML)
    responseData = {
      error: 'Non-JSON response received',
      contentType: response.headers.get('content-type'),
      response: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
    };
  }

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseData,
  };
}

/**
 * Format storage information for display
 * @param {Object} storage - Storage object from response containing storage details
 * @returns {string} Formatted storage information
 */
function formatStorageInfo(storage) {
  const { provider, properties } = storage;

  if (!provider) {
    return 'Unknown Storage';
  }

  let info = `${provider.toUpperCase()}`;

  if (provider === 's3' && properties?.bucket) {
    info += ` (${properties.bucket})`;
  } else if (provider === 'app-builder') {
    info += ' (Adobe I/O Files)';
  }

  return info;
}

/**
 * Validate parameters for specific actions
 * @param {string} actionName - The action being called
 * @param {Object} params - Parameters object
 * @throws {Error} If validation fails
 */
function validateActionParameters(actionName, params) {
  if (actionName === 'get-products') {
    const requiredParams = ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missingParams = requiredParams.filter((param) => !params[param]);

    if (missingParams.length > 0) {
      throw new Error(
        `Missing required parameters for get-products: ${missingParams.join(', ')}\n` +
          'These can be provided as command line arguments or will be loaded from .env file'
      );
    }

    // Validate URL format
    try {
      new URL(params.COMMERCE_URL);
    } catch (error) {
      throw new Error('Invalid COMMERCE_URL format - must be a valid URL');
    }
  }
}

function formatResponse(response) {
  const { statusCode, body } = response;
  const status = statusCode === 200 ? 'success' : 'error';
  const color = status === 'success' ? 'green' : 'red';

  console.log(chalk[color](`Status: ${status.toUpperCase()} (${statusCode})`));

  if (body.success) {
    console.log(chalk.white('Message:'), body.message);

    // Export statistics are shown in the detailed steps, so no separate section needed

    if (body.downloadUrl) {
      console.log(chalk.white('\n🔗 Download URL:'));
      console.log(chalk.blue(`   ${body.downloadUrl}`));
    }

    if (body.steps?.length > 0) {
      console.log(chalk.white('\nSteps:'));
      body.steps.forEach((step, index) => {
        console.log(chalk.green(`${index + 1}. ${step}`));
      });
    }

    if (body.data) {
      console.log(chalk.white('\nData:'), JSON.stringify(body.data, null, 2));
    }
  } else if (body.error) {
    console.log(chalk.red('Error:'), body.error);
    if (body.steps?.length > 0) {
      console.log(chalk.white('\nSteps before error:'));
      body.steps.forEach((step, index) => {
        console.log(chalk.red(`${index + 1}. ${step}`));
      });
    }
    if (body.response) {
      console.log(chalk.yellow('\nResponse Preview:'), body.response);
    }
  } else {
    console.log(chalk.yellow('Response:'), JSON.stringify(body, null, 2));
  }
}

async function main() {
  // Process parameters for the specific action
  const processedParams = processActionParameters(actionName, params);

  // Validate parameters for the specific action
  try {
    validateActionParameters(actionName, processedParams);
  } catch (error) {
    console.error(chalk.red(`Parameter validation error: ${error.message}`));
    process.exit(1);
  }

  if (rawOutput) {
    // Raw mode: just output JSON
    try {
      const actionUrl = buildRuntimeUrl(actionName);
      const response = await testAction(actionUrl, processedParams);
      console.log(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }, null, 2));
      process.exit(1);
    }
  } else {
    // Enhanced mode: user-friendly output with ora spinners
    const spinner = ora('Initializing test').start();
    console.log();

    try {
      spinner.text = 'Building action URL...';
      const actionUrl = buildRuntimeUrl(actionName);

      // Parameters are processed but not displayed for cleaner output

      spinner.text = `Testing action: ${actionName}`;
      const response = await testAction(actionUrl, processedParams);

      spinner.succeed(`Action tested: ${actionName}`);
      console.log(`🔗 URL: ${actionUrl}`);

      // Display storage information if available
      if (response.body.success && response.body.storage) {
        const storageInfo = formatStorageInfo(response.body.storage);
        console.log(`📦 Storage: ${storageInfo}`);
      }

      console.log(); // Add blank line before status
      formatResponse(response);
    } catch (error) {
      spinner.fail(`Test execution failed: ${error.message}`);
      process.exit(1);
    }
  }
}

main();
