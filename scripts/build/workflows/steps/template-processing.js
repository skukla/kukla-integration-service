/**
 * Template Processing Step
 * Updated to support independent mesh resolver architecture
 */

const fs = require('fs');
const path = require('path');

const { hash } = require('../../../core/operations');

/**
 * Process independent resolvers (no template processing needed)
 * @param {Object} params - Processing parameters
 * @param {Object} params.config - Environment configuration
 * @param {Object} params.meshConfig - Mesh configuration
 * @returns {Object} Processing result
 */
function templateProcessingStep(params) {
  const { meshConfig } = params;

  try {
    // Check if independent resolvers exist
    const requiredResolvers = [
      'mesh-products.js',
      'mesh-inventory.js', 
      'mesh-categories.js',
      'mesh-enriched.js',
    ];
    
    const missingResolvers = requiredResolvers.filter(resolver => 
      !fs.existsSync(path.join(process.cwd(), resolver))
    );
    
    if (missingResolvers.length > 0) {
      throw new Error(`Missing independent resolvers: ${missingResolvers.join(', ')}`);
    }

    // Independent resolvers approach - no template processing needed
    const metadata = {
      templateHash: 'independent-resolvers',
      configHash: hash.calculateObjectHash(meshConfig),
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    return {
      success: true,
      resolverContent: '// Independent resolvers - no combined template needed',
      metadata,
      source: 'independent',
    };

  } catch (error) {
    throw new Error(`Independent resolver processing failed: ${error.message}`);
  }
}

module.exports = {
  templateProcessingStep,
}; 
