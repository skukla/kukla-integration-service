/**
 * Deploy Domain Operations
 * Simple URL building utilities for deployment
 * Following Light DDD principles
 *
 * Pure exporter pattern - no function implementations in index.js
 */

const appDeploymentOutput = require('./app-deployment-output');
const meshDeploymentOutput = require('./mesh-deployment-output');
const urlBuilding = require('./url-building');

module.exports = {
  appDeploymentOutput,
  meshDeploymentOutput,
  urlBuilding,
};
