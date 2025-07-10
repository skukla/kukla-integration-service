/**
 * Mesh Compilation Operations
 * Business operations for mesh compilation processes
 *
 * Includes:
 * - Mesh resolver generation from templates
 * - Mesh configuration compilation to Adobe CLI format
 * - GraphQL schema verification
 */

const fs = require('fs');
const path = require('path');

// Import utilities from core
const { processGraphQLSchemas, generateAdobeCliFormat } = require('../../../src/core/utils');

/**
 * Generate mesh resolver from template with environment substitution
 * @param {Object} options - Generation options
 * @param {string} options.templatePath - Path to template file
 * @param {string} options.outputPath - Path for generated file
 * @param {Object} options.config - Configuration object for template substitution
 * @param {Object} options.substitutions - Template variable substitutions
 * @returns {Object} Generation result with success status and metadata
 */
async function generateMeshResolver({
  templatePath = 'mesh-resolvers.template.js',
  outputPath = 'mesh-resolvers.js',
  config,
  substitutions,
}) {
  try {
    if (!config) {
      throw new Error('Configuration object is required');
    }

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    // Prepare template substitutions from config if not provided
    const templateSubstitutions = substitutions || {
      COMMERCE_BASE_URL: config.commerce.baseUrl,
      COMMERCE_PRODUCT_FIELDS: config.products.fields.processing.join(','),
      MESH_CACHE_TTL: config.performance.caching.categories.meshTtl.toString(),
    };

    // Load template content
    let templateContent = fs.readFileSync(templatePath, 'utf8');

    // Apply template substitutions using core utility
    const { applyGenericSubstitutions } = require('../../../src/core/utils');
    templateContent = applyGenericSubstitutions(templateContent, templateSubstitutions);

    // Write generated file
    fs.writeFileSync(outputPath, templateContent);

    const stats = fs.statSync(outputPath);
    return {
      success: true,
      method: 'Template generation with environment substitution',
      templatePath,
      outputPath,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      substitutions: Object.keys(templateSubstitutions).length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Compile JavaScript mesh configuration to Adobe CLI-compatible JSON
 * @param {Object} options - Compilation options
 * @param {string} options.configPath - Path to mesh.config.js
 * @param {string} options.outputPath - Path for generated mesh.json
 * @returns {Object} Compilation result with success status and metadata
 */
async function compileMeshConfiguration({
  configPath = 'mesh.config.js',
  outputPath = 'mesh.json',
}) {
  try {
    // Load JavaScript configuration with cache clearing
    const absoluteConfigPath = path.resolve(configPath);
    delete require.cache[absoluteConfigPath];
    const meshConfig = require(absoluteConfigPath);

    // Process GraphQL schemas using core utility
    const processedConfig = processGraphQLSchemas(meshConfig);

    // Generate Adobe CLI-compatible structure using core utility
    const adobeConfig = generateAdobeCliFormat(processedConfig);

    // Write output file
    fs.writeFileSync(outputPath, JSON.stringify(adobeConfig, null, 2));

    const stats = fs.statSync(outputPath);
    const sdlInfo =
      typeof processedConfig.additionalTypeDefs === 'string'
        ? `Merged SDL string, ${processedConfig.additionalTypeDefs.length} chars`
        : 'SDL loaded from GraphQL files';

    return {
      success: true,
      method: 'Adobe meshConfig wrapper + merged SDL',
      outputPath,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      typeDefs: sdlInfo,
      resolvers: processedConfig.additionalResolvers?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify that required GraphQL schema files exist
 * @param {Object} options - Verification options
 * @param {string} options.schemaDir - Directory containing schema files
 * @param {string[]} options.requiredFiles - Required file names (from config)
 * @param {Object} options.config - Configuration object containing schema file list
 * @returns {Object} Verification result with success status and file counts
 */
async function verifyMeshSchemas({ schemaDir, requiredFiles, config } = {}) {
  // Get schema configuration from config object
  const schemaConfig = config?.mesh?.schema || {};
  const finalSchemaDir = schemaDir || schemaConfig.directory || 'src/mesh/schema';
  const finalRequiredFiles = requiredFiles ||
    schemaConfig.requiredFiles || [
      'productsResponse.graphql',
      'inventoryResponse.graphql',
      'categoriesResponse.graphql',
      'enrichedProduct.graphql',
      'query.graphql',
    ];

  const missing = [];
  const found = [];

  finalRequiredFiles.forEach((file) => {
    const filePath = path.join(finalSchemaDir, file);
    if (fs.existsSync(filePath)) {
      found.push(file);
    } else {
      missing.push(file);
    }
  });

  return {
    success: missing.length === 0,
    found: found.length,
    missing: missing.length,
    missingFiles: missing,
  };
}

module.exports = {
  generateMeshResolver,
  compileMeshConfiguration,
  verifyMeshSchemas,
};
