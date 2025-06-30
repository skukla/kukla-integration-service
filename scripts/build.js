/**
 * Main build script that coordinates validation and generation
 * Provides independent spinners for each build step
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const ora = require('ora');

const { generateFrontend } = require('./generate-frontend');
const { validateSchemas } = require('./test-schemas');
const { detectEnvironment } = require('../src/core/environment');

// Mesh status will be checked during build for potential use by npm start

const execAsync = promisify(exec);

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

// Mesh status checking is handled by start-with-mesh.js for npm start

/**
 * Main build function
 */
async function build() {
  try {
    // Step 1: Environment Detection
    const envSpinner = createSpinner('Detecting environment...');
    await sleep(500); // Give spinner time to spin
    const env = detectEnvironment({}, { allowCliDetection: true });
    const envDisplay = chalk.bold(capitalize(env));
    envSpinner.succeed(formatSpinnerSuccess('Environment detected: ' + envDisplay));

    // Step 2: Schema Validation
    const schemaSpinner = createSpinner('Validating schemas...');
    await sleep(500); // Give spinner time to spin
    const validationResult = await validateSchemas();
    if (!validationResult) {
      schemaSpinner.fail(chalk.red('Schema validation failed'));
      process.exit(1);
    }
    schemaSpinner.succeed(formatSpinnerSuccess('Schema validation completed'));

    // Step 3: Frontend Generation
    const frontendSpinner = createSpinner('Generating frontend assets...');
    await generateFrontend();
    frontendSpinner.succeed(formatSpinnerSuccess('Frontend assets generated'));

    // Step 4: Mesh Resolver Generation
    const meshSpinner = createSpinner('Generating mesh resolver...');
    await sleep(500); // Give spinner time to spin
    await execAsync('node scripts/generate-mesh-resolver.js');
    meshSpinner.succeed(formatSpinnerSuccess('Mesh resolver generated'));
  } catch (error) {
    // If any spinner is still active, stop it with failure
    ora().fail(chalk.red('Build failed: ' + error.message));
    process.exit(1);
  }
}

// Run the build
build();
