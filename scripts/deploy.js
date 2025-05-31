#!/usr/bin/env node

/**
 * Deployment script that handles all deployment scenarios
 * Supports:
 * --web-only: Deploy only web assets
 * --actions-only: Deploy only actions
 * --clean: Clean before deploying (default: true)
 */

const { execSync } = require('child_process');

const ora = require('ora');

// Parse arguments
const args = process.argv.slice(2);
const webOnly = args.includes('--web-only');
const actionsOnly = args.includes('--actions-only');
const skipClean = args.includes('--no-clean');

function execCommand(command, options = {}) {
  return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
}

async function clean() {
  if (skipClean) return;

  const spinner = ora('Cleaning build artifacts...').start();
  try {
    execCommand('rm -rf dist .parcel-cache');
    spinner.succeed('Build artifacts cleaned');
  } catch (error) {
    spinner.fail('Failed to clean build artifacts');
    throw error;
  }
}

async function build() {
  if (actionsOnly) return;

  const spinner = ora('Building web assets...').start();
  try {
    // Generate runtime config first
    require('./generate-runtime-config');
    execCommand('vite build');
    spinner.succeed('Web assets built successfully');
  } catch (error) {
    spinner.fail('Failed to build web assets');
    throw error;
  }
}

async function deploy() {
  const spinner = ora('Deploying to Adobe I/O Runtime...').start();

  try {
    let deployCommand = 'aio app deploy';
    if (webOnly) {
      deployCommand += ' --no-actions';
    }
    if (actionsOnly) {
      deployCommand += ' --no-web-assets';
    }

    const result = execCommand(deployCommand);
    spinner.succeed('Deployment completed successfully');
    console.log('\nDeployment Output:');
    console.log(result);
  } catch (error) {
    spinner.fail('Deployment failed');
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting deployment process...\n');

    await clean();
    await build();
    await deploy();

    console.log('\n✨ Deployment completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
