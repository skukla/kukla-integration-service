/**
 * Health Check Action
 * Business capability: Verify application deployment and runtime environment health
 */

const { createAction } = require('../../src/shared/action/action-factory');

/**
 * Health check workflow for deployment verification
 * @purpose Provide deployment verification and runtime health status
 * @param {Object} context - Action execution context
 * @returns {Promise<Object>} Health status with deployment and environment information
 * @usedBy health check action, deployment verification workflows
 */
async function healthCheckBusinessLogic(context) {
  const { config } = context;

  // Step 1: Gather environment information
  const environmentInfo = gatherEnvironmentInfo();

  // Step 2: Verify critical configuration
  const configStatus = verifyConfigurationHealth(config);

  // Step 3: Build health response
  return buildHealthResponse(environmentInfo, configStatus);
}

// Feature Operations

/**
 * Gather runtime environment information
 * @purpose Collect deployment and environment details for verification
 * @returns {Object} Environment information
 * @usedBy healthCheckBusinessLogic
 */
function gatherEnvironmentInfo() {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    },
    deployment: {
      version: process.env.npm_package_version || 'unknown',
      buildTimestamp: process.env.BUILD_TIMESTAMP || 'unknown',
      deployedAt: new Date().toISOString(),
    },
  };
}

/**
 * Verify critical configuration health
 * @purpose Check if essential configuration is available
 * @param {Object} config - Application configuration
 * @returns {Object} Configuration health status
 * @usedBy healthCheckBusinessLogic
 */
function verifyConfigurationHealth(config) {
  return {
    runtime: !!config.runtime,
    commerce: !!config.commerce,
    storage: !!config.storage,
    configLoaded: true,
  };
}

// Feature Utilities

/**
 * Build standardized health response
 * @purpose Create consistent health check response format
 * @param {Object} environmentInfo - Environment information
 * @param {Object} configStatus - Configuration status
 * @returns {Object} Complete health response
 * @usedBy healthCheckBusinessLogic
 */
function buildHealthResponse(environmentInfo, configStatus) {
  return {
    ...environmentInfo,
    config: configStatus,
    status: 'healthy',
    checks: {
      environment: 'pass',
      configuration: 'pass',
      runtime: 'pass',
    },
  };
}

module.exports = createAction(healthCheckBusinessLogic, {
  actionName: 'health',
  description: 'Application health check and deployment verification',
});
