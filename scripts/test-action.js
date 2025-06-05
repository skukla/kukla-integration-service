const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const yaml = require('js-yaml');
const fetch = require('node-fetch');
const ora = require('ora');

// Import URL building utilities
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

  return processedParams;
}

if (!actionName) {
  console.error(chalk.red('Please provide an action name'));
  console.log(chalk.yellow('Usage: node test-action.js <action-name> [key=value ...] [--raw]'));
  console.log(chalk.yellow('Examples:'));
  console.log(chalk.cyan('  node test-action.js get-products'));
  console.log(chalk.cyan('  node test-action.js delete-file fileName=products.csv'));
  console.log(chalk.cyan('  node test-action.js browse-files modal=true'));
  console.log(chalk.yellow('Options:'));
  console.log(chalk.cyan('  --raw    Output raw JSON response only'));
  console.log(
    chalk.yellow(
      '\nNote: For delete-file, fileName will automatically prepend "public/" if not present'
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

function formatResponse(response) {
  const { statusCode, body } = response;
  const status = statusCode === 200 ? 'success' : 'error';
  const color = status === 'success' ? 'green' : 'red';

  console.log(chalk[color](`Status: ${status.toUpperCase()} (${statusCode})`));

  if (body.success) {
    console.log(chalk.white('Message:'), body.message);

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

    try {
      spinner.text = 'Building action URL...';
      const actionUrl = buildRuntimeUrl(actionName);

      // Show parameters if any (show processed params to be transparent)
      if (Object.keys(processedParams).length > 0) {
        spinner.info(`Parameters: ${JSON.stringify(processedParams)}`);
        spinner.start();
      }

      spinner.text = `Testing action: ${actionName}`;
      const response = await testAction(actionUrl, processedParams);

      spinner.succeed(`Action tested: ${actionName}`);
      console.log(`🔗 URL: ${actionUrl}\n`);
      formatResponse(response);
    } catch (error) {
      spinner.fail(`Test execution failed: ${error.message}`);
      process.exit(1);
    }
  }
}

main();
