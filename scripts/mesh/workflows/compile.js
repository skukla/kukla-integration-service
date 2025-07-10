/**
 * Mesh Compilation Workflow
 * Clean orchestrator following refactoring standards
 *
 * Pure orchestration that coordinates mesh compilation operations
 * without handling presentation logic or business details.
 */

const {
  generateMeshResolver,
  verifyMeshSchemas,
  compileMeshConfiguration,
} = require('../operations/compilation');

/**
 * Execute complete mesh compilation workflow
 * @param {Object} options - Compilation options
 * @param {string} options.templatePath - Path to resolver template
 * @param {string} options.resolverPath - Path for generated resolver
 * @param {string} options.configPath - Path to JavaScript config
 * @param {string} options.outputPath - Path for JSON output
 * @param {Object} options.config - Configuration object (required)
 * @param {boolean} options.generateResolver - Whether to generate resolver first
 * @returns {Promise<Object>} Workflow result
 */
async function compileMeshWorkflow({
  templatePath = 'mesh-resolvers.template.js',
  resolverPath = 'mesh-resolvers.js',
  configPath = 'mesh.config.js',
  outputPath = 'mesh.json',
  config,
  generateResolver = true,
}) {
  try {
    if (!config) {
      throw new Error('Configuration object is required for mesh compilation workflow');
    }

    // Step 1: Verify schemas
    const schemaVerification = await verifyMeshSchemas({ config });
    if (!schemaVerification.success) {
      throw new Error(`Schema verification failed: ${schemaVerification.missingFiles?.join(', ')}`);
    }

    // Step 2: Generate resolver (if requested)
    let resolverGeneration = null;
    if (generateResolver) {
      resolverGeneration = await generateMeshResolver({
        templatePath,
        outputPath: resolverPath,
        config,
      });
      if (!resolverGeneration.success) {
        throw new Error(`Resolver generation failed: ${resolverGeneration.error}`);
      }
    }

    // Step 3: Compile configuration
    const compilation = await compileMeshConfiguration({ configPath, outputPath });
    if (!compilation.success) {
      throw new Error(`Configuration compilation failed: ${compilation.error}`);
    }

    const steps = [
      'Schema verification',
      generateResolver ? 'Resolver generation' : 'Resolver generation (skipped)',
      'Configuration compilation',
    ];

    return {
      success: true,
      workflow: 'Mesh compilation completed successfully',
      steps,
      results: { schemaVerification, resolverGeneration, compilation },
    };
  } catch (error) {
    return {
      success: false,
      workflow: 'Mesh compilation failed',
      error: error.message,
      steps: ['Schema verification', 'Resolver generation', 'Configuration compilation'],
      completedSteps: 0,
    };
  }
}

/**
 * Simple mesh compilation with default options
 * @param {Object} options - Optional configuration overrides
 * @param {Object} options.config - Configuration object (required)
 * @returns {Promise<Object>} Compilation result
 */
async function compileMeshConfig(options = {}) {
  if (!options.config) {
    // Load configuration if not provided
    const { loadConfig } = require('../../../config');
    options.config = loadConfig({});
  }

  return compileMeshWorkflow(options);
}

module.exports = {
  compileMeshWorkflow,
  compileMeshConfig,
};
