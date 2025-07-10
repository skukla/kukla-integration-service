/**
 * Deploy Workflows
 * All deployment-related workflow orchestrations
 */

const { appDeploymentWorkflow } = require('./app-deployment');
const { meshDeploymentWorkflow } = require('./mesh-deployment');

/**
 * Deploy workflows catalog
 * Organizes all deployment workflow functions
 */
module.exports = {
  appDeploymentWorkflow,
  meshDeploymentWorkflow,
};
