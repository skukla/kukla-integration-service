/**
 * Mesh Generation Workflow
 * Extracted from scripts/generate-mesh-resolver.js for domain organization
 * Handles mesh resolver generation
 */

const steps = require('./steps');

/**
 * Generate mesh resolver from template
 * @param {Object} options - Generation options
 * @param {boolean} options.force - Force regeneration
 * @param {boolean} options.verbose - Verbose output
 * @returns {Promise<Object>} Generation result
 */
async function generateMeshResolver(options = {}) {
  try {
    // Step 1: Extract mesh configuration and paths
    const configResult = await steps.meshConfigExtraction.meshConfigExtractionStep();
    
    // Step 2: Check if regeneration is needed
    const regenerationCheck = steps.regenerationCheck.regenerationCheckStep(
      { templatePath: configResult.templatePath, resolverPath: configResult.resolverPath },
      configResult.meshConfig,
      options
    );

    if (!regenerationCheck.needed) {
      if (options.verbose) {
        console.log('✅ Mesh resolver is up to date');
        console.log(`   Reason: ${regenerationCheck.reason}`);
      }
      return {
        success: true,
        generated: false,
        reason: regenerationCheck.reason,
      };
    }

    // Step 3: Process template with configuration
    const processingResult = steps.templateProcessing.templateProcessingStep({
      templatePath: configResult.templatePath,
      config: configResult.config,
      meshConfig: configResult.meshConfig,
    });

    // Step 4: Generate the resolver file
    steps.fileGeneration.fileGenerationStep({
      resolverPath: configResult.resolverPath,
      resolverContent: processingResult.resolverContent,
      reason: regenerationCheck.reason,
    });

    return {
      success: true,
      generated: true,
      environment: configResult.environment,
      reason: regenerationCheck.reason,
      metadata: processingResult.metadata,
    };

  } catch (error) {
    throw new Error(`Mesh resolver generation failed: ${error.message}`);
  }
}

// Keep the old function for backward compatibility
function needsRegeneration(templatePath, resolverPath, meshConfig, options = {}) {
  return steps.regenerationCheck.regenerationCheckStep(
    { templatePath, resolverPath },
    meshConfig,
    options
  );
}

module.exports = {
  generateMeshResolver,
  needsRegeneration,
}; 
