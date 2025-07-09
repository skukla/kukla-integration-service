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

  // Write the resolver file (no console output - parent workflow handles spinner)
  fs.writeFileSync(resolverPath, resolverContent);

  return {
    success: true,
    filePath: resolverPath,
    reason,
  };
}

module.exports = {
  fileGenerationStep,
}; 
