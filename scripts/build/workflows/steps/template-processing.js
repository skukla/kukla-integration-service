/**
 * Template Processing Step
 * Handles template-based mesh resolver generation
 */

const fs = require('fs');
const path = require('path');

const { hash } = require('../../../core/operations');

/**
 * Process mesh resolver template and generate final resolver
 * @param {Object} params - Processing parameters
 * @param {Object} params.config - Environment configuration
 * @param {Object} params.meshConfig - Mesh configuration
 * @returns {Object} Processing result
 */
function templateProcessingStep(params) {
  const { config, meshConfig } = params;

  try {
    // Step 1: Template-based approach: check if template exists and process it
    const templatePath = path.join(process.cwd(), 'mesh-resolvers.template.js');
    const resolverPath = path.join(process.cwd(), 'mesh-resolvers.js');

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file mesh-resolvers.template.js not found');
    }

    // Step 2: Read template content
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Step 3: Calculate hashes to determine if regeneration is needed
    const templateHash = hash.calculateFileHash(templatePath);
    
    // Remove timestamp from config hash calculation (it changes every build)
    const stableConfig = { ...meshConfig };
    delete stableConfig.timestamp;
    const configHash = hash.calculateObjectHash(stableConfig);

    // Step 4: Check if resolver exists and is up to date
    let needsRegeneration = true;
    let existingMetadata = null;

    if (fs.existsSync(resolverPath)) {
      try {
        const resolverContent = fs.readFileSync(resolverPath, 'utf8');
        const metadataMatch = resolverContent.match(/\/\*\* METADATA: (.+) \*\//);
        if (metadataMatch) {
          existingMetadata = JSON.parse(metadataMatch[1]);
          needsRegeneration = existingMetadata.templateHash !== templateHash || 
                            existingMetadata.configHash !== configHash;
        }
      } catch (error) {
        // If we can't read metadata, assume regeneration is needed
        needsRegeneration = true;
      }
    }

    if (!needsRegeneration) {
      return {
        success: true,
        resolverGenerated: false,
        reason: 'Template and config unchanged',
        metadata: existingMetadata,
        source: 'cached',
      };
    }

    // Step 5: Generate resolver from template
    const resolverContent = processTemplate(templateContent, config);

    // Step 6: Add metadata to the resolver
    const metadata = {
      templateHash,
      configHash,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const finalContent = `/** METADATA: ${JSON.stringify(metadata)} */\n${resolverContent}`;

    // Step 7: Write the generated resolver
    fs.writeFileSync(resolverPath, finalContent);

    return {
      success: true,
      resolverGenerated: true,
      resolverContent: finalContent,
      metadata,
      source: 'template',
    };

  } catch (error) {
    throw new Error(`Template processing failed: ${error.message}`);
  }
}

/**
 * Process template with configuration substitution
 * @param {string} templateContent - Template content
 * @param {Object} config - Configuration object
 * @returns {string} Processed content
 */
function processTemplate(templateContent, config) {
  let processed = templateContent;

  // Replace common configuration placeholders
  const replacements = {
    '{{{COMMERCE_BASE_URL}}}': config.commerce.baseUrl,
    '{{{MESH_API_KEY}}}': config.mesh.apiKey,
    '{{{ENVIRONMENT}}}': config.environment,
    '{{{COMMERCE_PRODUCT_FIELDS}}}': config.products.fields.export.join(','), // Use products config for Commerce API requests
    '{{{MESH_CACHE_TTL}}}': config.performance.caching.categories.meshTtl,
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    processed = processed.replace(new RegExp(placeholder, 'g'), value);
  });

  return processed;
}

module.exports = {
  templateProcessingStep,
}; 
