/**
 * Template Processing Step
 * Handles template loading and variable replacement
 */

const fs = require('fs');

const { formatProductFieldsForUrl } = require('../../../../src/commerce/utils/endpoint-builders');
const { hash } = require('../../../core');

/**
 * Process template with configuration variables
 * @param {Object} params - Processing parameters
 * @param {string} params.templatePath - Template file path
 * @param {Object} params.config - Environment configuration
 * @param {Object} params.meshConfig - Mesh configuration
 * @returns {Object} Processing result
 */
function templateProcessingStep(params) {
  const { templatePath, config, meshConfig } = params;

  // Load the template file
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Calculate hashes for metadata using core utilities
  const templateHash = hash.calculateFileHash(templatePath);
  const configHash = hash.calculateObjectHash(meshConfig);
  const generatedAt = new Date().toISOString();

  // Create generation metadata
  const metadata = {
    templateHash,
    configHash,
    generatedAt,
    version: '1.0.0',
  };

  // Replace template variables
  const variables = {
    COMMERCE_BASE_URL: config.commerce.baseUrl,
          MESH_CACHE_TTL: config.performance.caching.categories.meshTtl.toString(),
          COMMERCE_PRODUCT_FIELDS: formatProductFieldsForUrl(config.products.fields.export),
  };

  let resolverContent = templateContent;
  
  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{{${key}}}}`, 'g');
    resolverContent = resolverContent.replace(regex, value);
  });
  
  // Replace mesh config placeholder
  resolverContent = resolverContent.replace('__MESH_CONFIG__', JSON.stringify(meshConfig, null, 2));

  // Update generation metadata
  resolverContent = resolverContent.replace(
    /\/\* GENERATION_METADATA:.*?\*\//,
    `/* GENERATION_METADATA: ${JSON.stringify(metadata)} */`
  );

  return {
    success: true,
    resolverContent,
    metadata,
  };
}

module.exports = {
  templateProcessingStep,
}; 
