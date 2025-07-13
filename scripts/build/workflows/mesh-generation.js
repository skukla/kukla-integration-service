/**
 * Mesh Generation Workflow
 * Clean orchestrator for mesh generation following Light DDD standards
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { meshGenerationOutput } = require('../operations');
const { meshCoreOperations } = require('../operations');

/**
 * Generate mesh resolver and configuration with verbose deployment-style output
 * @param {Object} options - Generation options
 * @param {boolean} options.isProd - Whether generating for production
 * @returns {Promise<Object>} Generation result
 */
async function generateMeshResolver(options = {}) {
  const { isProd = false } = options;
  const environment = getEnvironmentString(isProd);
  
  const steps = [];
  
  try {
    // Step 1: Initial setup with environment info
    await meshGenerationOutput.displayInitialSetup(environment);

    // Step 2: Load configuration and display progress
    await meshGenerationOutput.displayConfigurationLoading();
    console.log(format.success('Configuration loaded'));
    steps.push('Configuration loaded for mesh generation');

    // Step 3: Display mesh configuration extraction
    await meshGenerationOutput.displayMeshConfigExtraction();
    
    // Step 4: Display template processing
    await meshGenerationOutput.displayTemplateProcessing();

    // Step 5: Execute core mesh generation operations
    const result = await meshCoreOperations.generateMeshCore({ isProd });
    if (!result.success) {
      throw new Error(result.error);
    }

    // Step 6: Display detailed results
    await meshGenerationOutput.displayMeshConfigSuccess(result.results.outputPath);
    steps.push('Mesh configuration extracted and processed');

    await meshGenerationOutput.displayTemplateResult(result.results.templateResult);
    steps.push(result.generated 
      ? 'Mesh resolver template processed and regenerated'
      : 'Mesh resolver template checked (no regeneration needed)');

    // Step 7: Display completion summary
    await meshGenerationOutput.displayCompletionSummary(environment, result.results.meshConfigResult, result.results.templateResult);

    return {
      success: true,
      generated: result.generated,
      workflow: 'mesh-generation-workflow',
      environment,
      steps,
      results: result.results,
    };

  } catch (error) {
    console.log();
    console.log(format.error(`Mesh generation failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      steps,
    };
  }
}

module.exports = {
  generateMeshResolver,
}; 
