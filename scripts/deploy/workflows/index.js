/**
 * Deploy Workflows
 * All deployment-related workflow orchestrations
 */

const appDeployment = require('./app-deployment');
const meshDeployment = require('./mesh-deployment');

/**
 * Deploy workflows catalog
 * Organizes all deployment workflow functions
 */
module.exports = {
  appDeployment,
  meshDeployment,
};
