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

async function runDeployCommand(command, description, suppressCompletion = false) {
  console.log(format.deploymentAction(description));
  await format.sleep(500);

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    if (!suppressCompletion) {
      console.log(format.success(`${description} completed`));
    }
    return true;
  } catch (error) {
    console.error(format.error(`${description} failed: ${error.message}`));
    return false;
  }
}

function getMeshSourceHash() {
  try {
    const sourceFiles = [
      // Templates and config
      'mesh/resolvers.template.js',
      'mesh/config.js',
      'config.js',
      // GraphQL queries and types
      'mesh/queries/products-list.gql',
      'mesh/queries/categories-batch.gql',
      'mesh/queries/inventory-batch.gql',
      'mesh/queries/get-enriched-products.gql',
      'mesh/types/schema.graphql',
      // Schema files
      'mesh/schema/products-response.json',
      'mesh/schema/category-batch-resp.json',
      'mesh/schema/inventory-batch-resp.json',
    ];

    let combinedContent = '';
    for (const file of sourceFiles) {
      if (fs.existsSync(file)) {
        combinedContent += fs.readFileSync(file, 'utf8');
      }
    }

    return crypto.createHash('md5').update(combinedContent).digest('hex');
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

async function purgeMeshCache(isProd, environment) {
  const cacheCommand = `aio api-mesh:cache:purge -a -c${isProd ? ' --prod' : ''}`;
  if (!(await runDeployCommand(cacheCommand, `Purging mesh cache in ${environment}`))) {
    console.log(format.warning('Cache purge failed, proceeding with mesh update anyway'));
  }
}

async function updateMeshConfiguration(isProd, environment) {
  const meshCommand = `cd mesh && echo "y" | aio api-mesh update mesh.json${isProd ? ' --prod' : ''}`;
  return await runDeployCommand(meshCommand, `Updating mesh configuration in ${environment}`);
}

function checkMeshStatus(statusOutput) {
  // Success detection
  if (statusOutput.includes('Mesh provisioned successfully.')) {
    return 'success';
  }

  // Failure detection
  if (
    statusOutput.includes('failed') ||
    statusOutput.includes('error') ||
    statusOutput.includes('Failed') ||
    statusOutput.includes('ERROR')
  ) {
    return 'failed';
  }

  // Continue polling
  if (statusOutput.includes('provisioning') || statusOutput.includes('Provisioning')) {
    return 'provisioning';
  }

  return 'unknown';
}

async function pollMeshStatus() {
  const maxTimeout = 10 * 60 * 1000; // 10 minutes
  const pollInterval = 30 * 1000; // 30 seconds
  const maxAttempts = Math.ceil(maxTimeout / pollInterval);

  const spinner = ora({
    text: format.muted('Provisioning mesh...'),
    spinner: 'dots',
  }).start();

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;

    try {
      await format.sleep(pollInterval);

      const statusOutput = execSync('aio api-mesh:status', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000, // 10 seconds
      });

      const status = checkMeshStatus(statusOutput);

      if (status === 'success') {
        spinner.stop();
        console.log(format.success('Mesh provisioned and ready'));
        return true;
      }

      if (status === 'failed') {
        spinner.stop();
        console.log(format.error('Mesh deployment failed - check status manually'));
        return false;
      }

      if (status === 'provisioning') {
        spinner.text = format.muted('Mesh still provisioning...');
      }
    } catch (error) {
      // Only fail if near timeout
      if (attempts >= maxAttempts - 2) {
        spinner.stop();
        console.log(format.warning(`Mesh status polling failed: ${error.message}`));
        console.log(format.warning('Mesh update may still be in progress - check manually'));
        return true;
      }
    }
  }

  spinner.stop();
  console.log(format.warning('Mesh deployment timed out (10 minutes)'));
  console.log(format.warning('You may need to check mesh status manually'));
  return true;
}

async function updateMeshWithPolling(isProd = false) {
  const environment = isProd ? 'production' : 'staging';

  await purgeMeshCache(isProd, environment);

  if (!(await updateMeshConfiguration(isProd, environment))) {
    return false;
  }

  return await pollMeshStatus();
}

async function deployApp(isProd = false) {
  const environment = isProd ? 'production' : 'staging';

  // Display environment info
  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(format.deploymentStart(`Deploying application to ${environment.toLowerCase()}...`));
  console.log();
  await format.sleep(800);

  // Build frontend config
  if (!(await runBuildCommand('node scripts/build.js --config-only', 'Building frontend config'))) {
    return false;
  }

  // Check and update mesh configuration
  const oldMeshHash = getStoredMeshHash();
  let meshChanged = false;
  let newMeshHash = null;

  const spinner = ora({
    text: format.muted('Checking mesh configuration for changes...'),
    spinner: 'dots',
  }).start();

  try {
    execSync('node scripts/build.js --mesh-only', { stdio: 'pipe', cwd: process.cwd() });
    newMeshHash = getMeshSourceHash();
    meshChanged = oldMeshHash !== newMeshHash;

    if (meshChanged) {
      spinner.stop();
      console.log(format.success('Mesh configuration (updated)'));
    } else {
      spinner.stop();
      console.log(format.success('Mesh configuration (no changes)'));
    }
  } catch (error) {
    spinner.stop();
    console.error(format.error(`Mesh configuration check failed: ${error.message}`));
    return false;
  }

  // Deploy to Adobe I/O Runtime
  console.log();
  const deployCommand = `aio app deploy${isProd ? ' --prod' : ''}`;
  try {
    execSync(deployCommand, { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error(format.error(`Deployment to ${environment} failed: ${error.message}`));
    return false;
  }

  // Update mesh if configuration changed
  let additionalWorkDone = false;
  if (meshChanged && newMeshHash) {
    console.log();
    console.log(format.deploymentAction('Mesh configuration changed, updating deployed mesh...'));
    additionalWorkDone = true;
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
  } else if (!newMeshHash) {
    console.log();
    console.log(format.warning('Could not determine mesh configuration status'));
  }

  // Success message if additional work was done
  if (additionalWorkDone) {
    console.log();
    console.log(
      format.celebration(`Application deployed successfully to ${environment.toLowerCase()}!`)
    );
  }
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

  // Step 2: Update mesh configuration with polling
  const meshUpdateSuccess = await updateMeshWithPolling(isProd);
  if (!meshUpdateSuccess) {
    console.log(format.error('Mesh deployment failed'));
    return false;
  }

  // Step 3: Store the new mesh hash
  const newMeshHash = getMeshSourceHash();
  if (newMeshHash) {
    storeMeshHash(newMeshHash);
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
