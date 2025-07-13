/**
 * Build Domain - Core Mesh Operations
 * Pure business logic for mesh generation without display concerns
 */

const { loadConfig } = require('../../../config');
const { meshConfigExtractionStep } = require('../workflows/steps/mesh-config-extraction');
const { templateProcessingStep } = require('../workflows/steps/template-processing');

/**
 * Generate mesh resolver and configuration (core business logic only)
 * @param {Object} options - Generation options
 * @param {boolean} options.isProd - Whether generating for production
 * @returns {Promise<Object>} Generation result
 */
async function generateMeshCore(options = {}) {
  const { isProd = false } = options;
  
  try {
    // Step 1: Load configuration
    const config = loadConfig({}, isProd);

    // Step 2: Extract mesh configuration
    const meshConfigResult = await meshConfigExtractionStep({ config });
    if (!meshConfigResult.success) {
      throw new Error(`Mesh config extraction failed: ${meshConfigResult.error}`);
    }

    // Step 3: Process template and generate resolver
    const templateResult = await templateProcessingStep({
      config,
      meshConfig: meshConfigResult.meshConfig,
    });
    if (!templateResult.success) {
      throw new Error(`Template processing failed: ${templateResult.error}`);
    }

    return {
      success: true,
      generated: templateResult.resolverGenerated,
      environment: isProd ? 'production' : 'staging',
      results: {
        meshConfig: meshConfigResult.meshConfig,
        resolverGenerated: templateResult.resolverGenerated,
        configPath: meshConfigResult.configPath,
        outputPath: meshConfigResult.outputPath,
        templateResult,
        meshConfigResult,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  generateMeshCore,
}; 
