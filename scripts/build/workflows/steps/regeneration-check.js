/**
 * Regeneration Check Step
 * Handles checking if mesh resolver regeneration is needed
 */

const fs = require('fs');

const hash = require('../../operations/hash');

/**
 * Check if mesh resolver regeneration is needed
 * @param {Object} paths - File paths
 * @param {string} paths.templatePath - Template file path
 * @param {string} paths.resolverPath - Resolver file path
 * @param {Object} meshConfig - Mesh configuration
 * @param {Object} options - Check options
 * @param {boolean} options.force - Force regeneration
 * @returns {Object} Regeneration check result
 */
function regenerationCheckStep(paths, meshConfig, options = {}) {
  const { templatePath, resolverPath } = paths;
  const { force = false } = options;

  if (force) {
    return { needed: true, reason: 'Forced regeneration requested' };
  }

  if (!fs.existsSync(resolverPath)) {
    return { needed: true, reason: 'Resolver file does not exist' };
  }

  try {
    // Calculate current hashes using core utilities
    const currentTemplateHash = hash.calculateFileHash(templatePath);
    const currentConfigHash = hash.calculateObjectHash(meshConfig);

    // Read existing resolver file to check metadata
    const resolverContent = fs.readFileSync(resolverPath, 'utf8');
    const metadataMatch = resolverContent.match(/\/\* GENERATION_METADATA: (.*?) \*\//);

    if (!metadataMatch) {
      return { needed: true, reason: 'No generation metadata found' };
    }

    const metadata = JSON.parse(metadataMatch[1]);

    // Compare hashes
    if (metadata.templateHash !== currentTemplateHash) {
      return { needed: true, reason: 'Template file has changed' };
    }

    if (metadata.configHash !== currentConfigHash) {
      return { needed: true, reason: 'Configuration has changed' };
    }

    return { needed: false, reason: 'Resolver is up to date' };

  } catch (error) {
    return { needed: true, reason: `Error checking metadata: ${error.message}` };
  }
}

module.exports = {
  regenerationCheckStep,
  calculateFileHash: hash.calculateFileHash,
  calculateObjectHash: hash.calculateObjectHash,
}; 
