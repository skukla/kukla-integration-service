/**
 * Mesh Generation Workflow
 * Direct implementation using build workflow steps
 * Handles mesh resolver generation and mesh configuration compilation
 */

const { meshConfigExtractionStep } = require('./steps/mesh-config-extraction');
const { templateProcessingStep } = require('./steps/template-processing');
const { loadConfig } = require('../../../config');

/**
 * Generate mesh resolver and configuration using build workflow steps
 * @param {Object} options - Generation options
 * @param {boolean} options.isProd - Whether generating for production
 * @returns {Promise<Object>} Generation result
 */
async function generateMeshResolver(options = {}) {
  const { isProd = false } = options;
  const steps = [];
  
  try {
    // Step 1: Load configuration
    const config = loadConfig({}, isProd);

    // Step 2: Extract mesh configuration
    const meshConfigResult = await meshConfigExtractionStep({ isProd });
    if (!meshConfigResult.success) {
      throw new Error(`Mesh config extraction failed: ${meshConfigResult.error}`);
    }
    steps.push('Mesh configuration extracted');

    // Step 3: Process template and generate resolver
    const templateResult = await templateProcessingStep({
      config,
      meshConfig: meshConfigResult.meshConfig,
    });
    if (!templateResult.success) {
      throw new Error(`Template processing failed: ${templateResult.error}`);
    }
    steps.push('Mesh resolver template processed');
    steps.push('Mesh resolver file generated');

    return {
      success: true,
      generated: templateResult.resolverGenerated,
      workflow: 'mesh-generation-workflow',
      steps,
      results: {
        meshConfig: meshConfigResult.meshConfig,
        resolverGenerated: templateResult.resolverGenerated,
      },
    };

  } catch (error) {
    throw new Error(`Mesh resolver generation failed: ${error.message}`);
  }
}

module.exports = {
  generateMeshResolver,
}; 
