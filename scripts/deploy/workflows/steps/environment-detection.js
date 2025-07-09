/**
 * Environment Detection Step
 * Handles environment detection with user feedback
 */

const { operations } = require('../../../');

/**
 * Detect and display environment information
 * @returns {Promise<Object>} Environment detection result
 */
async function environmentDetectionStep() {
  const envSpinner = operations.spinner.createSpinner('Detecting environment...');
  await operations.command.sleep(800);

  const env = operations.environment.detectScriptEnvironment({}, { allowCliDetection: true });

  envSpinner.succeed(operations.spinner.formatSpinnerSuccess(`Environment detected: ${env}`));
  await operations.command.sleep(300);

  return {
    success: true,
    environment: env,
    step: 'Environment detected',
  };
}

module.exports = {
  environmentDetectionStep,
};
