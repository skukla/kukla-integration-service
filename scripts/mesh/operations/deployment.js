/**
 * Mesh Deployment Operations
 * Business operations for mesh deployment processes
 *
 * Includes:
 * - Mesh update operations with retry logic
 * - Mesh status checking
 * - Adobe CLI mesh update execution
 */

const { spawn } = require('child_process');

// Import utilities from core
const { sleep } = require('../../../src/core/utils');

/**
 * Check mesh status using aio CLI
 * @returns {Promise<Object>} Mesh status result with success flag and status data
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
 * Execute mesh update command using Adobe CLI
 * @returns {Promise<Object>} Update command result with success flag and output
 */
async function executeMeshUpdate() {
  return new Promise((resolve, reject) => {
    // Use compiled mesh.json file - mesh.config.js is compiled to JSON format before this step
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
 * @param {string} options.environment - Target environment (staging|production)
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.pollInterval - Polling interval in seconds
 * @param {number} options.maxPollChecks - Maximum polling checks
 * @param {Function} options.onEvent - Event callback for status updates
 * @returns {Promise<Object>} Update result with success status and metadata
 */
async function updateMeshWithRetry(options = {}) {
  const {
    environment = 'staging',
    maxRetries = 3,
    pollInterval = 30,
    maxPollChecks = environment === 'production' ? 20 : 6,
    onEvent = () => {}, // Default no-op callback
  } = options;

  // Emit start event
  onEvent({
    type: 'meshUpdateStart',
    message: 'Starting mesh update process',
    environment,
    maxRetries,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Execute update command
      const updateResult = await executeMeshUpdate();

      if (!updateResult.success) {
        if (attempt === maxRetries) {
          throw new Error(`Mesh update failed after ${maxRetries} attempts: ${updateResult.error}`);
        }
        onEvent({
          type: 'retryWarning',
          message: `Attempt ${attempt} failed: ${updateResult.error}`,
          attempt,
          maxRetries,
        });
        continue;
      }

      // Start status polling
      onEvent({
        type: 'pollingStart',
        message: `Starting status polling (${pollInterval}s intervals, max ${maxPollChecks} checks)`,
        pollInterval,
        maxPollChecks,
      });

      for (let check = 1; check <= maxPollChecks; check++) {
        await sleep(pollInterval * 1000);

        const statusResult = await checkMeshStatus();

        if (!statusResult.success) {
          onEvent({
            type: 'statusWarning',
            message: `Status check ${check} failed: ${statusResult.error}`,
            check,
            maxPollChecks,
          });
          continue;
        }

        onEvent({
          type: 'statusInfo',
          message: `Status check ${check}/${maxPollChecks}: ${statusResult.status}`,
          check,
          maxPollChecks,
          status: statusResult.status,
        });

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
      onEvent({
        type: 'attemptWarning',
        message: `Attempt ${attempt} failed: ${error.message}`,
        attempt,
        maxRetries,
      });
    }
  }
}

module.exports = {
  updateMeshWithRetry,
  checkMeshStatus,
  executeMeshUpdate,
};
