const chalk = require('chalk');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Get the action name from command line
const actionName = process.argv[2];
if (!actionName) {
  console.error(chalk.red('Please provide an action name'));
  console.log(chalk.yellow('Usage: node test-action.js <action-name>'));
  console.log(chalk.yellow('Available actions:'));
  const config = yaml.load(fs.readFileSync(path.join(__dirname, '../app.config.yaml'), 'utf8'));
  const actions = Object.keys(config.application.runtimeManifest.packages['kukla-integration-service'].actions);
  actions.forEach(action => console.log(chalk.cyan(`  - ${action}`)));
  process.exit(1);
}

async function main() {
  try {
    // Initialize the SDK
    const orgId = process.env.AIO_ORG_ID;
    const apiKey = process.env.AIO_API_KEY;
    const namespace = process.env.AIO_RUNTIME_NAMESPACE;

    if (!orgId || !apiKey || !namespace) {
      throw new Error('Missing required environment variables. Make sure you are logged in with `aio runtime auth`');
    }

    // Get the action URL
    const actionUrl = `https://adobeioruntime.net/api/v1/web/${namespace}/kukla-integration-service/${actionName}`;

    console.log(chalk.blue(`Testing action: ${actionName}`));
    console.log(chalk.gray(`URL: ${actionUrl}`));
    console.log(chalk.yellow('Response:'));

    const response = await fetch(actionUrl);
    const data = await response.json();
    
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

main(); 