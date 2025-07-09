/**
 * File Generation Step
 * Handles writing the generated resolver file
 */

const fs = require('fs');

/**
 * Generate resolver file from processed content
 * @param {Object} params - Generation parameters
 * @param {string} params.resolverPath - Output file path
 * @param {string} params.resolverContent - Processed content
 * @param {string} params.reason - Reason for generation
 * @returns {Object} Generation result
 */
function fileGenerationStep(params) {
  const { resolverPath, resolverContent, reason } = params;

  console.log('🔄 Generating mesh resolver...');
  console.log(`   Reason: ${reason}`);

  // Write the resolver file
  fs.writeFileSync(resolverPath, resolverContent);

  console.log('✅ Mesh resolver generated successfully');

  return {
    success: true,
    filePath: resolverPath,
    reason,
  };
}

module.exports = {
  fileGenerationStep,
}; 
