/**
 * Generate frontend assets from backend configuration and logic
 * Handles config and URL generation for frontend
 */

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const ora = require('ora');

const { loadConfig } = require('../config');
const { detectEnvironment } = require('../src/core/environment');

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

  // Load configuration with proper environment detection
  const configSpinner = useSpinners ? createSpinner('Loading configuration...') : null;
  const env = detectEnvironment({}, { allowCliDetection: true });
  const config = loadConfig({ NODE_ENV: env });
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
      url: config.runtime.url,
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
export const RUNTIME_URL = '${config.runtime.url || ''}';
export const RUNTIME_PATHS = ${JSON.stringify(config.runtime.paths, null, 2)};
export const RUNTIME_ACTIONS = ${JSON.stringify(config.runtime.actions, null, 2)};
`;
  await writeGeneratedFile(path.join(outputDir, 'urls.js'), urlContent);
  if (urlSpinner) {
    await sleep(500); // Give spinner time to spin
    urlSpinner.succeed(formatSpinnerSuccess('URL configuration generated'));
  }

  // Only show final success message when run directly (not from build.js)
  if (require.main === module) {
    const envDisplay = capitalize(env);
    console.log(formatSuccess('Frontend assets generated (' + envDisplay + ')'));
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
