/**
 * Deployment Steps
 * Individual step functions for deployment workflow
 */

const appDeployment = require('./app-deployment');
const buildCleaning = require('./build-cleaning');
const buildProcess = require('./build-process');
const environmentDetection = require('./environment-detection');
const meshOnlyDeployment = require('./mesh-only-deployment');
const meshStatusCheck = require('./mesh-status-check');
const meshUpdate = require('./mesh-update');

module.exports = {
  environmentDetection,
  buildCleaning,
  buildProcess,
  meshStatusCheck,
  appDeployment,
  meshUpdate,
  meshOnlyDeployment,
};
