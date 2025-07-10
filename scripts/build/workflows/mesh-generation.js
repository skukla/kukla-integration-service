/**
 * Mesh Generation Workflow
 * Updated to use new mesh domain architecture
 * Handles both mesh resolver generation and mesh configuration compilation
 */

const { mesh } = require('../../');
const { loadConfig } = require('../../../config');
const core = require('../../core');

/**
 * Generate mesh resolver and configuration using new mesh domain
 * @param {Object} options - Generation options
 * @param {boolean} options.force - Force regeneration
 * @param {boolean} options.verbose - Verbose output
 * @returns {Promise<Object>} Generation result
 */
async function generateMeshResolver(options = {}) {
  const { verbose = false } = options;

  try {
    if (verbose) {
      console.log(core.formatting.info('Using mesh domain for resolver and configuration generation...'));
    }

    // Load configuration for mesh domain
    const config = loadConfig({});

    // Use mesh domain compilation workflow to generate both resolver and config
    const compilationResult = await mesh.workflows.compile.compileMeshWorkflow({
      templatePath: 'mesh-resolvers.template.js',
      resolverPath: 'mesh-resolvers.js', 
      configPath: 'mesh.config.js',
      outputPath: 'mesh.json',
      config,
      generateResolver: true,
    });

    if (!compilationResult.success) {
      throw new Error(`Mesh compilation failed: ${compilationResult.error}`);
    }

    if (verbose) {
      console.log(core.formatting.success('✅ Mesh domain compilation completed successfully'));
      compilationResult.steps.forEach((step, index) => {
        console.log(core.formatting.info(`   ${index + 1}. ${step}`));
      });
    }

    return {
      success: true,
      generated: true,
      workflow: 'mesh-domain-compilation',
      steps: compilationResult.steps,
      results: compilationResult.results,
    };

  } catch (error) {
    throw new Error(`Mesh resolver generation failed: ${error.message}`);
  }
}

// Keep the old function for backward compatibility (simplified for mesh domain)
function needsRegeneration() {
  // Always regenerate when using mesh domain workflow
  // The mesh domain handles its own change detection
  return {
    needed: true,
    reason: 'Using mesh domain workflow regeneration',
  };
}

module.exports = {
  generateMeshResolver,
  needsRegeneration,
}; 
