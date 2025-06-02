const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const chalk = require('chalk');
const yaml = require('js-yaml');
const fetch = require('node-fetch');

const execAsync = util.promisify(exec);
const { loadConfig } = require('../config');

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

function formatResponse(data, showTrace) {
  if (!showTrace && data.trace) {
    const { trace, ...rest } = data;
    return rest;
  }
  return data;
}

async function main() {
  try {
    const config = loadConfig();
    const tracingEnabled = config.app?.monitoring?.tracing?.enabled ?? false;

    const namespace = await getNamespace();

    // Get the action URL
    const actionUrl = `https://adobeioruntime.net/api/v1/web/${namespace}/kukla-integration-service/${actionName}`;

    console.log(chalk.blue(`Testing action: ${actionName}`));
    console.log(chalk.gray(`URL: ${actionUrl}`));
    console.log(chalk.yellow('Response:'));

    const response = await fetch(actionUrl);
    const data = await response.json();

    // Format response based on tracing configuration
    const formattedData = formatResponse(data, tracingEnabled);
    console.log(JSON.stringify(formattedData, null, 2));
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

main();
