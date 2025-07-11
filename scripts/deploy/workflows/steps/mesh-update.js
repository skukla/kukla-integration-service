/**
 * Mesh Update Step
 * Handles updating the API Mesh when needed
 * Following standardized deploy domain pattern
 */

const { spawn } = require('child_process');

const format = require('../../../core/formatting');

/**
 * Update API Mesh if needed
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
      step: 'Mesh update skipped',
    };
  }

  console.log(format.info('Updating API Mesh configuration'));

  const meshCommand = isProd ? 'npm run deploy:mesh:prod' : 'npm run deploy:mesh';
  const [cmd, ...args] = meshCommand.split(' ');

  // Standardized deploy domain command execution pattern
  const meshProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  try {
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

    console.log(format.success('✅ Mesh update completed successfully'));
    return {
      success: true,
      step: 'Mesh updated with template-generated resolver and external GraphQL schemas',
    };
  } catch (error) {
    console.log(format.warning(`Mesh update failed: ${error.message}`));
    console.log(format.info(`You may need to run: ${meshCommand} manually`));

    // Mesh failure shouldn't stop deployment - return success with warning
    return {
      success: true,
      error: error.message,
      step: 'Mesh update failed (manual intervention needed)',
    };
  }
}

module.exports = {
  meshUpdateStep,
};
