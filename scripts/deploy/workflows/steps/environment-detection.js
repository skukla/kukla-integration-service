/**
 * Environment Detection Step
 * Detects and validates deployment environment
 */

const core = require('../../../core');
const format = require('../../../format');

/**
 * Detect and validate environment step
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment detection result
 */
async function detectAndValidateEnvironment(environment) {
  try {
    console.log(format.info(`Detecting environment: ${environment}`));

    // Validate environment
    if (!['staging', 'production'].includes(environment)) {
      throw new Error(`Invalid environment: ${environment}. Must be 'staging' or 'production'`);
    }

    // Detect current workspace
    const detectedEnv = core.detectEnvironment();

    if (detectedEnv !== environment) {
      console.log(
        format.warning(`Environment mismatch: detected ${detectedEnv}, requested ${environment}`)
      );
    }

    console.log(format.step(`Environment validated: ${environment}`));

    return {
      success: true,
      environment,
      detected: detectedEnv,
      step: `Environment detection completed for ${environment}`,
    };
  } catch (error) {
    console.error(format.error(`Environment detection failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      step: 'Environment detection failed',
    };
  }
}

module.exports = {
  detectAndValidateEnvironment,
};
