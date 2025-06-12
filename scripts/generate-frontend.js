/**
 * Generate frontend assets from backend configuration and logic
 * Consolidates config and URL generation for simpler build process
 */

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const ora = require('ora');

const { loadConfig } = require('../config');
const { detectEnvironment } = require('../src/core/environment');

// Parse command line arguments
const args = process.argv.slice(2);
const skipMesh = args.includes('--skip-mesh');
const meshOnly = args.includes('--mesh-only');

// Helper to capitalize first letter
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Sleep helper for smoother animations
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a spinner for a specific step
 */
function createSpinner(text) {
  return ora({
    text,
    spinner: 'dots',
    color: 'blue',
  }).start();
}

/**
 * Format spinner success message (no checkmark since ora adds one)
 */
function formatSpinnerSuccess(message) {
  return chalk.green(message);
}

/**
 * Format success message with green checkmark
 */
function formatSuccess(message) {
  return chalk.green('✔') + ' ' + chalk.green(message);
}

/**
 * Write file with proper error handling
 */
async function writeGeneratedFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await fs.promises.writeFile(filePath, content);
  await sleep(100); // Small pause after each file write
}

/**
 * Generate frontend configuration
 */
async function generateFrontend(useSpinners = false) {
  // Create the output directory if it doesn't exist
  const outputDir = path.join('web-src', 'src', 'config', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load configuration
  const configSpinner = useSpinners ? createSpinner('Loading configuration...') : null;
  const config = loadConfig();
  const env = detectEnvironment({}, { allowCliDetection: true });
  if (configSpinner) {
    await sleep(500); // Give spinner time to spin
    configSpinner.succeed(formatSpinnerSuccess('Configuration loaded'));
  }

  // Generate frontend configuration
  const frontendSpinner = useSpinners ? createSpinner('Generating frontend config...') : null;
  const frontendConfig = {
    environment: env,
    runtime: {
      package: config.runtime.package,
      version: config.runtime.version,
      paths: config.runtime.paths,
      actions: config.runtime.actions,
    },
    performance: {
      timeout: config.commerce.timeout || 30000,
      maxExecutionTime: config.performance.maxExecutionTime || 30000,
    },
  };

  // Write frontend configuration
  const configContent = `/* eslint-disable */\nexport default ${JSON.stringify(frontendConfig, null, 2)};\n`;
  await writeGeneratedFile(path.join(outputDir, 'config.js'), configContent);
  if (frontendSpinner) {
    await sleep(500); // Give spinner time to spin
    frontendSpinner.succeed(formatSpinnerSuccess('Frontend config generated'));
  }

  // Generate frontend URLs
  const urlSpinner = useSpinners ? createSpinner('Generating URL configuration...') : null;
  const urlContent = `/* eslint-disable */
export const RUNTIME_PACKAGE = '${config.runtime.package}';
export const RUNTIME_VERSION = '${config.runtime.version}';
export const RUNTIME_PATHS = ${JSON.stringify(config.runtime.paths, null, 2)};
export const RUNTIME_ACTIONS = ${JSON.stringify(config.runtime.actions, null, 2)};
`;
  await writeGeneratedFile(path.join(outputDir, 'urls.js'), urlContent);
  if (urlSpinner) {
    await sleep(500); // Give spinner time to spin
    urlSpinner.succeed(formatSpinnerSuccess('URL configuration generated'));
  }

  // Generate mesh files if not skipped
  if (!skipMesh || meshOnly) {
    const meshSpinner = useSpinners ? createSpinner('Generating mesh files...') : null;

    // Generate mesh configuration
    const meshConfig = {
      baseUrl: config.commerce.baseUrl,
      timeout: config.mesh?.timeout || 30000,
      pageSize: config.products?.perPage || 50,
      maxPages: config.products?.maxTotal || 1000,
    };
    const meshConfigContent = `/* eslint-disable */\nmodule.exports = ${JSON.stringify(meshConfig, null, 2)};\n`;
    await writeGeneratedFile('mesh-config.js', meshConfigContent);

    // Generate mesh resolvers
    const meshResolversContent = `/* eslint-disable */
const config = require('./mesh-config');

module.exports = {
  resolvers: {
    Query: {
      mesh_products_full: {
        resolve: async (parent, args, context) => {
          // Get credentials from headers
          const username = context.headers['x-commerce-username'];
          const password = context.headers['x-commerce-password'];

          // Call existing REST action via HTTP
          const restResponse = await fetch(config.baseUrl + '/rest/V1/products', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + username + ':' + password,
            },
          });

          const data = await restResponse.json();
          return {
            products: data.products || [],
            total_count: data.total_count || 0,
            message: 'Success via HTTP bridge',
            status: 'success',
          };
        },
      },
    },
  },
};`;
    await writeGeneratedFile('mesh-resolvers.js', meshResolversContent);

    if (meshSpinner) {
      await sleep(500); // Give spinner time to spin
      meshSpinner.succeed(formatSpinnerSuccess('Mesh files generated'));
    }
  }

  // Only show final success message when run directly (not from build.js)
  if (require.main === module) {
    const envDisplay = capitalize(env);
    console.log(formatSuccess('All frontend files generated (' + envDisplay + ')'));
  }
}

// Support both direct execution and module usage
if (require.main === module) {
  generateFrontend(true) // Enable spinners when run directly
    .then(() => process.exit(0))
    .catch((error) => {
      ora().fail(chalk.red('Frontend generation failed: ' + error.message));
      process.exit(1);
    });
} else {
  module.exports = { generateFrontend };
}
