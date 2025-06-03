const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const chalk = require('chalk');
const yaml = require('js-yaml');
const fetch = require('node-fetch');
const ora = require('ora');

const execAsync = util.promisify(exec);

// Get the action name from command line
const actionName = process.argv[2];
if (!actionName) {
  console.error(chalk.red('Please provide an action name'));
  console.log(chalk.yellow('Usage: node test-action.js <action-name>'));
  console.log(chalk.yellow('Available actions:'));
  const config = yaml.load(fs.readFileSync(path.join(__dirname, '../app.config.yaml'), 'utf8'));
  const actions = Object.keys(
    config.application.runtimeManifest.packages['kukla-integration-service'].actions
  );
  actions.forEach((action) => console.log(chalk.cyan(`  - ${action}`)));
  process.exit(1);
}

async function getNamespace() {
  try {
    const { stdout } = await execAsync('aio runtime namespace list');
    // Skip the header lines and get the first namespace
    const lines = stdout.trim().split('\n');
    const namespaceLines = lines.filter(
      (line) => !line.includes('Namespaces') && !line.includes('─')
    );
    if (namespaceLines.length === 0) {
      throw new Error(
        'No namespace found. Make sure you are logged in and have selected a project.'
      );
    }
    return namespaceLines[0].trim();
  } catch (error) {
    throw new Error(
      'Failed to get namespace. Make sure you are logged in with `aio auth login` and have selected a project with `aio app use`'
    );
  }
}

async function testAction(actionUrl) {
  const response = await fetch(actionUrl);
  const responseData = await response.json();

  return {
    statusCode: response.status,
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
  } else if (body.error) {
    console.log(chalk.red('Error:'), body.error);
    if (body.steps?.length > 0) {
      console.log(chalk.white('\nSteps before error:'));
      body.steps.forEach((step, index) => {
        console.log(chalk.red(`${index + 1}. ${step}`));
      });
    }
  } else {
    console.log(chalk.yellow('Response:'), JSON.stringify(body, null, 2));
  }
}

async function main() {
  const spinner = ora('Initializing test').start();

  try {
    spinner.text = 'Getting namespace...';
    const namespace = await getNamespace();
    const actionUrl = `https://adobeioruntime.net/api/v1/web/${namespace}/kukla-integration-service/${actionName}`;

    spinner.text = `Testing action: ${actionName}`;
    const response = await testAction(actionUrl);

    spinner.succeed(`Action tested: ${actionName}`);
    formatResponse(response);
  } catch (error) {
    spinner.fail(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

main();
