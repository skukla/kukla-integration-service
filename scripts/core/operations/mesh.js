/**
 * Scripts Core Mesh Operations
 * Shared mesh update operations used by deployment scripts
 */

const { spawn } = require('child_process');

const { basicFormatters } = require('../utils');
const { meshTemplates } = require('./mesh-templates');

/**
 * Sleep utility for status polling
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check mesh status using aio CLI
 * @returns {Promise<Object>} Mesh status result
 */
async function checkMeshStatus() {
  return new Promise((resolve, reject) => {
    const statusProcess = spawn('aio', ['api-mesh:status'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    statusProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    statusProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    statusProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const statusData = JSON.parse(stdout);
          resolve({
            success: true,
            status: statusData.status,
            data: statusData,
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse status response: ${parseError.message}`,
          });
        }
      } else {
        resolve({
          success: false,
          error: stderr || `Status check failed with code ${code}`,
        });
      }
    });

    statusProcess.on('error', (error) => {
      reject(new Error(`Failed to execute status check: ${error.message}`));
    });
  });
}

/**
 * Execute mesh update command
 * @returns {Promise<Object>} Update command result
 */
async function executeMeshUpdate() {
  return new Promise((resolve, reject) => {
    const updateProcess = spawn('aio', ['api-mesh:update', 'mesh.json'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    updateProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    updateProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    updateProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout,
        });
      } else {
        resolve({
          success: false,
          error: stderr || `Update command failed with code ${code}`,
          output: stdout,
        });
      }
    });

    updateProcess.on('error', (error) => {
      reject(new Error(`Failed to execute mesh update: ${error.message}`));
    });
  });
}

/**
 * Update API Mesh with retry logic and status polling
 * @param {Object} options - Update options
 * @param {string} options.environment - Target environment
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.pollInterval - Polling interval in seconds
 * @param {number} options.maxPollChecks - Maximum polling checks
 * @returns {Promise<Object>} Update result
 */
async function updateMeshWithRetry(options = {}) {
  const {
    environment = 'staging',
    maxRetries = 3,
    pollInterval = 30,
    maxPollChecks = environment === 'production' ? 20 : 6,
  } = options;

  console.log(meshTemplates.meshUpdateStart());

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Execute update command
      const updateResult = await executeMeshUpdate();

      if (!updateResult.success) {
        if (attempt === maxRetries) {
          throw new Error(`Mesh update failed after ${maxRetries} attempts: ${updateResult.error}`);
        }
        console.log(basicFormatters.warning(`Attempt ${attempt} failed: ${updateResult.error}`));
        continue;
      }

      // Start status polling
      console.log(meshTemplates.meshPollingStart(pollInterval, maxPollChecks));

      for (let check = 1; check <= maxPollChecks; check++) {
        await sleep(pollInterval * 1000);

        const statusResult = await checkMeshStatus();

        if (!statusResult.success) {
          console.log(
            basicFormatters.warning(`Status check ${check} failed: ${statusResult.error}`)
          );
          continue;
        }

        console.log(
          basicFormatters.progress(`Status check ${check}/${maxPollChecks}: ${statusResult.status}`)
        );

        if (statusResult.status === 'success') {
          return {
            success: true,
            message: 'Mesh update completed successfully',
            attempts: attempt,
            checks: check,
          };
        }

        if (statusResult.status === 'failed') {
          throw new Error('Mesh update failed during processing');
        }
      }

      // If we get here, we've exhausted polling attempts
      throw new Error(`Mesh update status polling timeout after ${maxPollChecks} checks`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(basicFormatters.warning(`Attempt ${attempt} failed: ${error.message}`));
    }
  }
}

module.exports = {
  updateMeshWithRetry,
  checkMeshStatus,
  executeMeshUpdate,
  sleep,
};
