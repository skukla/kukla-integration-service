/**
 * Scripts Domain Catalog
 *
 * Following Domain-Driven Design (DDD) principles where each domain
 * has its own complete hierarchy of workflows, operations, and utils.
 *
 * Architecture:
 * scripts/
 * ├── core/         # Core infrastructure domain (shared utilities)
 * │   ├── operations/   # Shared operations (environment, spinner, hash)
 * │   └── utils/        # Shared utilities (format, string, file)
 * ├── build/        # Build domain
 * │   ├── workflows/    # High-level build orchestration
 * │   └── operations/   # Mid-level build processes
 * ├── deploy/       # Deployment domain
 * │   ├── workflows/    # High-level deployment orchestration
 * │   └── operations/   # Mid-level deployment processes
 * └── test/         # Testing domain
 *     ├── workflows/    # High-level test orchestration
 *     └── operations/   # Mid-level test processes
 *
 * The core domain provides shared infrastructure that eliminates
 * duplication across build, deploy, and test domains.
 */

const { spawn } = require('child_process');

const chalk = require('chalk');

/**
 * Update API Mesh with retry logic
 * @param {Object} options - Update options
 * @param {boolean} options.isProd - Whether in production
 * @returns {Promise<boolean>} Success status
 */
async function updateMeshWithRetry(options = {}) {
  const { isProd = false } = options;

  try {
    console.log(chalk.blue('🔄 Updating API Mesh...'));

    // Execute mesh update command
    const updateCommand = isProd
      ? 'aio api-mesh update mesh.json --workspace=Production'
      : 'aio api-mesh update mesh.json';

    const [cmd, ...args] = updateCommand.split(' ');

    const updateProcess = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      updateProcess.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.yellow(`⚠️ Mesh update command exited with code ${code}`));
          reject(new Error(`Mesh update failed with exit code ${code}`));
        } else {
          console.log(chalk.green('✅ Mesh update command completed'));
          resolve();
        }
      });

      updateProcess.on('error', (err) => {
        console.log(chalk.red('❌ Failed to start mesh update command'));
        reject(err);
      });
    });

    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Mesh update failed: ${error.message}`));
    return false;
  }
}

module.exports = {
  // Core infrastructure shared across all domains
  core: require('./core'),

  // Shared operations for backwards compatibility
  operations: {
    environment: require('./core/operations/environment'),
    spinner: require('./core/operations/spinner'),
    hash: require('./core/operations/hash'),
    sleep: require('./core/utils').sleep,
    mesh: {
      updateMeshWithRetry,
    },
  },

  // Domain-specific exports
  build: {
    workflows: {
      appBuild: require('./build/workflows/app-build'),
      meshGeneration: require('./build/workflows/mesh-generation'),
      frontendGeneration: require('./build/workflows/frontend-generation'),
    },
    operations: require('./build/operations'),
  },

  deploy: {
    workflows: {
      appDeployment: require('./deploy/workflows/app-deployment'),
      meshDeployment: require('./deploy/workflows/mesh-deployment'),
    },
    operations: require('./deploy/operations'),
  },

  test: {
    workflows: {
      actionTesting: require('./test/workflows/action-testing'),
      apiTesting: require('./test/workflows/api-testing'),
      performanceTesting: require('./test/workflows/performance-testing'),
    },
    operations: require('./test/operations'),
  },
};
