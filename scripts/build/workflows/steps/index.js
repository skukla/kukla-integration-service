/**
 * Build Steps
 * Individual step functions for build workflows
 */

const fileGeneration = require('./file-generation');
const meshConfigExtraction = require('./mesh-config-extraction');
const regenerationCheck = require('./regeneration-check');
const templateProcessing = require('./template-processing');

module.exports = {
  meshConfigExtraction,
  regenerationCheck,
  templateProcessing,
  fileGeneration,
}; 
