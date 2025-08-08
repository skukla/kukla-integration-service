#!/usr/bin/env node

/**
 * Simplified Deploy Script for Adobe App Builder
 * Essential deployment functionality without over-engineered abstractions
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const ora = require('ora');

const { format, parseArgs, isProdEnvironment } = require('./utils/shared');

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

    // Re-throw error so caller can access error details for better messaging
    throw new Error(error.message);
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
      'mesh/types/types.graphql',
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
  try {
    await runDeployCommand(cacheCommand, `Purging mesh cache in ${environment}`);
  } catch (error) {
    // Don't fail deployment for cache purge issues - just warn and continue
    console.log(format.warning('Cache purge failed, proceeding with mesh update anyway'));
  }
}

async function updateMeshConfiguration(isProd, environment) {
  const meshCommand = `cd mesh && echo "y" | aio api-mesh update mesh.json${isProd ? ' --prod' : ''}`;
  await runDeployCommand(meshCommand, `Updating mesh configuration in ${environment}`);
  return true;
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

  // Try to purge cache, but don't fail if it doesn't exist
  try {
    await purgeMeshCache(isProd, environment);
  } catch (error) {
    console.log(format.warning('Cache purge failed, proceeding with mesh update anyway'));
  }

  // This will throw an error if mesh update fails, allowing caller to handle it
  const meshUpdateSuccess = await updateMeshConfiguration(isProd, environment);
  if (!meshUpdateSuccess) {
    return false;
  }

  return await pollMeshStatus();
}

async function checkMeshChanges() {
  const oldMeshHash = getStoredMeshHash();
  const spinner = ora({
    text: format.muted('Checking mesh configuration for changes...'),
    spinner: 'dots',
  }).start();

  try {
    execSync('node scripts/build.js --mesh-only', { stdio: 'pipe', cwd: process.cwd() });
    const newMeshHash = getMeshSourceHash();
    const meshChanged = oldMeshHash !== newMeshHash;

    spinner.stop();
    if (meshChanged) {
      console.log(format.success('Mesh configuration (updated)'));
    } else {
      console.log(format.success('Mesh configuration (no changes)'));
    }

    return { meshChanged, newMeshHash };
  } catch (error) {
    spinner.stop();
    console.error(format.error(`Mesh configuration check failed: ${error.message}`));
    throw error;
  }
}

async function handleMeshUpdate(isProd, environment, meshChanged, newMeshHash) {
  if (!meshChanged || !newMeshHash) {
    return { success: true, failed: false };
  }

  console.log();
  console.log(format.deploymentAction('Mesh configuration changed, updating deployed mesh...'));

  try {
    const meshUpdateSuccess = await updateMeshWithPolling(isProd);
    if (meshUpdateSuccess) {
      storeMeshHash(newMeshHash);
      return { success: true, failed: false };
    } else {
      return { success: false, failed: true, reason: 'Mesh update failed' };
    }
  } catch (error) {
    let reason = error.message;
    if (error.message.includes('No mesh found') || error.message.includes('Unable to update')) {
      reason = 'No mesh provisioned in workspace';
    }
    return { success: false, failed: true, reason };
  }
}

function displayFinalResults(environment, meshResult) {
  console.log();

  if (meshResult.failed) {
    console.log(
      format.warning(
        `Application deployed to ${environment.toLowerCase()} with mesh configuration issues`
      )
    );
    console.log(`   → App deployment: ${format.success('SUCCESS')}`);
    console.log(`   → Mesh deployment: ${format.error('FAILED')} (${meshResult.reason})`);
    console.log();
    console.log(format.muted('Next steps:'));
    if (meshResult.reason.includes('No mesh') || meshResult.reason.includes('workspace')) {
      console.log(format.muted('   • Provision mesh via Adobe Developer Console'));
      console.log(format.muted('   • Verify workspace configuration'));
    }
    console.log(format.muted('   • Run: npm run deploy:mesh'));
    console.log();
    console.log(
      format.warning('⚠ Mesh-dependent features will not work until mesh is provisioned')
    );
  } else {
    console.log(
      format.celebration(`Application deployed successfully to ${environment.toLowerCase()}!`)
    );
  }
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

  // Check for mesh changes
  const { meshChanged, newMeshHash } = await checkMeshChanges();

  // Deploy to Adobe I/O Runtime
  console.log();
  const deployCommand = `aio app deploy${isProd ? ' --prod' : ''}`;
  try {
    execSync(deployCommand, { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error(format.error(`Deployment to ${environment} failed: ${error.message}`));
    return false;
  }

  // Handle mesh update if needed
  const meshResult = await handleMeshUpdate(isProd, environment, meshChanged, newMeshHash);

  // Display final results
  displayFinalResults(environment, meshResult);

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

  const isProd = isProdEnvironment(args);

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
