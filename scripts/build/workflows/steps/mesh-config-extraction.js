/**
 * Mesh Configuration Extraction Step
 * Pure orchestrator for mesh configuration extraction
 */

const { fileOperations } = require('../../../core/operations');
const meshConfigProcessing = require('../../operations/mesh-config-processing');

/**
 * Extract and generate mesh configuration for deployment
 * @param {Object} options - Extraction options
 * @param {Object} options.config - Application configuration
 * @param {string} options.outputPath - Output path for mesh.json
 * @returns {Promise<Object>} Extraction result
 */
async function meshConfigExtractionStep(options) {
  const { config, outputPath = 'mesh.json' } = options;

  if (!config) {
    throw new Error('Configuration is required for mesh config extraction');
  }

  try {
    // Step 1: Load mesh configuration
    const meshConfigModule = meshConfigProcessing.loadMeshConfig();

    // Step 2: Process mesh configuration
    const processedConfig = meshConfigProcessing.buildMeshConfig(meshConfigModule, config);

    // Step 3: Write generated mesh.json
    fileOperations.writeJsonFile(outputPath, processedConfig);

    return {
      success: true,
      meshConfig: processedConfig,
      configPath: 'mesh.config.js',
      outputPath,
      step: 'Mesh configuration generated from mesh.config.js',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  meshConfigExtractionStep,
}; 
