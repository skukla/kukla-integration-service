/**
 * Mesh Update Step
 * Spinner-based mesh flow: Configuration → Deployment → Provisioning → Ready
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');

const format = require('../../../core/formatting');
const { createSpinner, succeedSpinner, failSpinner } = require('../../../core/operations/spinner');

const execAsync = promisify(exec);

/**
 * Update API Mesh with spinner-based flow
 * @param {Object} options - Update options
 * @param {boolean} options.isProd - Whether in production
 * @param {boolean} options.skipMesh - Whether to skip mesh updates
 * @returns {Promise<Object>} Update result
 */
async function meshUpdateStep(options = {}) {
  const { isProd = false, skipMesh = false } = options;

  if (skipMesh) {
    return {
      success: true,
      skipped: true,
      step: 'Mesh update skipped',
    };
  }

  try {
    // Step 1: Configuration generation
    const configSpinner = createSpinner('Generating mesh.json configuration...');
    await format.sleep(400);
    succeedSpinner(configSpinner, 'Mesh configuration generated (mesh.json)');
    await format.sleep(300);

    // Step 2: Execute mesh update command (Adobe CLI will show its output)
    const meshCommand = isProd
      ? 'aio api-mesh update mesh.json --workspace=Production --autoConfirmAction'
      : 'aio api-mesh update mesh.json --autoConfirmAction';

    const [cmd, ...args] = meshCommand.split(' ');

    const meshProcess = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      meshProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Mesh update failed with exit code ${code}`));
        } else {
          resolve();
        }
      });

      meshProcess.on('error', (err) => {
        reject(new Error(`Failed to start mesh update command: ${err.message}`));
      });
    });

    // Step 3: Provisioning phase with spinner
    const provisionSpinner = createSpinner('Provisioning mesh...');

    const statusResult = await waitForMeshDeployment();

    if (!statusResult.success) {
      failSpinner(provisionSpinner, 'Mesh provisioning failed');
      throw new Error(statusResult.error);
    }

    succeedSpinner(provisionSpinner, 'Mesh provisioned and ready');

    return {
      success: true,
      step: 'API Mesh provisioned and ready',
    };
  } catch (error) {
    console.log(format.warning(`Mesh update failed: ${error.message}`));
    console.log(format.info('You may need to run mesh update manually'));

    return {
      success: true,
      error: error.message,
      step: 'Mesh update failed (manual intervention needed)',
    };
  }
}

/**
 * Wait for mesh deployment to complete by polling status
 * @returns {Promise<Object>} Status result
 */
async function waitForMeshDeployment() {
  const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
  const pollInterval = 3000; // 3 seconds between polls
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const statusCommand = 'aio api-mesh:status';
      const { stdout } = await execAsync(statusCommand);

      if (stdout.includes('Mesh provisioned successfully.')) {
        return { success: true };
      }

      if (stdout.includes('failed') || stdout.includes('error') || stdout.includes('Failed')) {
        return {
          success: false,
          error: 'Mesh deployment failed - check status manually',
        };
      }

      // Continue polling silently - let the spinner show progress
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (attempts >= maxAttempts - 2) {
        return {
          success: false,
          error: `Status polling failed: ${error.message}`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  return {
    success: false,
    error: 'Mesh deployment timed out (90 seconds) - check status manually',
  };
}

module.exports = {
  meshUpdateStep,
};
