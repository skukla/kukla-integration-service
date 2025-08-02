#!/usr/bin/env node

/**
 * Simplified Deploy Script for Adobe App Builder
 * Essential deployment functionality without over-engineered abstractions
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const chalk = require('chalk');
const ora = require('ora');

// Formatting functions matching master branch style
const format = {
  success: (message) => chalk.green(`✔ ${message}`),
  error: (message) => chalk.red(`✖ ${message}`),
  warning: (message) => chalk.yellow(`⚠ ${message}`),
  deploymentStart: (message) => `🚀 ${message}`,
  deploymentAction: (message) => `🔧 ${message}`,
  celebration: (message) => `🎉 ${message}`,
  majorSuccess: (message) => chalk.green(`✅ ${message}`),
  environment: (env) => env.charAt(0).toUpperCase() + env.slice(1),
  muted: (message) => chalk.gray(message),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      parsed[key] = value || true;
    }
  }
  return parsed;
}

async function runBuildCommand(command, description) {
  const spinner = ora({
    text: format.muted(description),
    spinner: 'dots',
  }).start();

  try {
    execSync(command, { stdio: 'pipe', cwd: process.cwd() });
    spinner.stop();
    console.log(format.success(description));
    return true;
  } catch (error) {
    spinner.stop();
    console.error(format.error(`${description} failed: ${error.message}`));
    return false;
  }
}

async function runDeployCommand(command, description) {
  console.log(format.deploymentAction(description));
  await format.sleep(500);

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(format.success(`${description} completed`));
    return true;
  } catch (error) {
    console.error(format.error(`${description} failed: ${error.message}`));
    return false;
  }
}

function getMeshResolverHash() {
  try {
    const resolverContent = fs.readFileSync('mesh-resolvers.js', 'utf8');
    return crypto.createHash('md5').update(resolverContent).digest('hex');
  } catch (error) {
    return null;
  }
}

function getStoredMeshHash() {
  try {
    return fs.readFileSync('.mesh-hash', 'utf8').trim();
  } catch (error) {
    return null;
  }
}

function storeMeshHash(hash) {
  fs.writeFileSync('.mesh-hash', hash);
}

async function updateMeshWithPolling(isProd = false) {
  const environment = isProd ? 'production' : 'staging';
  const meshCommand = `aio api-mesh update mesh.json${isProd ? ' --prod' : ''}`;

  if (!(await runDeployCommand(meshCommand, `Updating mesh configuration in ${environment}`))) {
    return false;
  }

  // Poll for mesh deployment completion using aio api-mesh:status
  const spinner = ora({
    text: format.muted('Provisioning mesh...'),
    spinner: 'dots',
  }).start();

  const maxTimeout = 10 * 60 * 1000; // 10 minutes total (following master branch)
  const pollInterval = 30 * 1000; // 30 seconds between polls (following master branch)
  const maxAttempts = Math.ceil(maxTimeout / pollInterval);

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;

    try {
      await format.sleep(pollInterval);

      // Check mesh status using Adobe CLI
      const statusCommand = 'aio api-mesh:status';
      const statusOutput = execSync(statusCommand, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000, // 10 second timeout for status check
      });

      // Success detection (following master branch patterns)
      if (statusOutput.includes('Mesh provisioned successfully.')) {
        spinner.stop();
        console.log(format.success('Mesh provisioned and ready'));
        return true;
      }

      // Failure detection
      if (
        statusOutput.includes('failed') ||
        statusOutput.includes('error') ||
        statusOutput.includes('Failed') ||
        statusOutput.includes('ERROR')
      ) {
        spinner.stop();
        console.log(format.error('Mesh deployment failed - check status manually'));
        return false;
      }

      // Continue polling for unclear status or provisioning state
      if (statusOutput.includes('provisioning') || statusOutput.includes('Provisioning')) {
        spinner.text = format.muted('Mesh still provisioning...');
        continue;
      }
    } catch (error) {
      // Only fail if we're near the end and can't get status
      if (attempts >= maxAttempts - 2) {
        spinner.stop();
        console.log(format.warning(`Mesh status polling failed: ${error.message}`));
        console.log(format.warning('Mesh update may still be in progress - check manually'));
        return true; // Don't fail deployment for status check issues
      }
    }
  }

  spinner.stop();
  console.log(format.warning('Mesh deployment timed out (10 minutes)'));
  console.log(format.warning('You may need to check mesh status manually'));
  return true; // Don't fail deployment for timeout
}

async function deployApp(isProd = false) {
  const environment = isProd ? 'production' : 'staging';

  // Display initial setup with environment info (matching master branch)
  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(format.deploymentStart(`Deploying application to ${environment.toLowerCase()}...`));
  console.log();
  await format.sleep(800);

  // Step 1: Build frontend config
  if (!(await runBuildCommand('node scripts/build.js --config-only', 'Building frontend config'))) {
    return false;
  }

  // Step 2: Generate mesh resolver and check for changes
  const oldMeshHash = getStoredMeshHash();
  if (!(await runBuildCommand('node scripts/build.js --mesh-only', 'Generating mesh resolver'))) {
    return false;
  }
  const newMeshHash = getMeshResolverHash();
  const meshChanged = oldMeshHash !== newMeshHash;

  // Step 3: Deploy to Adobe I/O Runtime
  console.log();
  const deployCommand = `aio app deploy${isProd ? ' --prod' : ''}`;
  if (!(await runDeployCommand(deployCommand, `Deploying to ${environment}`))) {
    return false;
  }

  // Step 4: Update mesh if resolver changed (following master branch patterns)
  if (meshChanged && newMeshHash) {
    console.log();
    console.log(format.deploymentAction('Mesh resolver changed, updating deployed mesh...'));
    try {
      const meshUpdateSuccess = await updateMeshWithPolling(isProd);
      if (meshUpdateSuccess) {
        storeMeshHash(newMeshHash);
      } else {
        console.log(
          format.warning(
            'Mesh update failed - deployment succeeded but mesh may need manual update'
          )
        );
        console.log(format.muted('   → You can run: npm run deploy:mesh'));
      }
    } catch (error) {
      console.log(format.warning(`Mesh update encountered issues: ${error.message}`));
      console.log(format.warning('Deployment completed but mesh may need manual update'));
      console.log(format.muted('   → You can run: npm run deploy:mesh'));
    }
  } else if (newMeshHash) {
    console.log();
    console.log(format.success('Mesh resolver unchanged, skipping mesh update'));
  } else {
    console.log();
    console.log(format.warning('Could not determine mesh resolver status'));
  }

  // Final celebration
  console.log();
  console.log(
    format.celebration(`Application deployed successfully to ${environment.toLowerCase()}!`)
  );
  return true;
}

async function deployMesh(isProd = false) {
  const environment = isProd ? 'production' : 'staging';

  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(format.deploymentStart('Updating API Mesh...'));
  console.log();
  await format.sleep(800);

  // Step 1: Generate mesh resolver
  if (!(await runBuildCommand('node scripts/build.js --mesh-only', 'Generating mesh resolver'))) {
    return false;
  }

  // Step 2: Update mesh configuration
  const meshCommand = `aio api-mesh update mesh.json${isProd ? ' --prod' : ''}`;
  if (!(await runDeployCommand(meshCommand, `Updating mesh configuration in ${environment}`))) {
    return false;
  }

  console.log();
  console.log(
    format.celebration(`Mesh configuration deployed successfully to ${environment.toLowerCase()}!`)
  );
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run deploy [options]

Options:
  --help                  Show this help message
  --mesh-only            Deploy mesh configuration only
  --environment=prod     Deploy to production (default: staging)

Examples:
  npm run deploy                    # Deploy app to staging
  npm run deploy:prod              # Deploy app to production
  npm run deploy:mesh              # Deploy mesh to staging
  npm run deploy:mesh:prod         # Deploy mesh to production
    `);
    return;
  }

  const isProd = args.environment === 'production';

  try {
    let success;

    if (args['mesh-only']) {
      success = await deployMesh(isProd);
    } else {
      success = await deployApp(isProd);
    }

    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error(format.error('Deployment failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(format.error('Deployment failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { main };
