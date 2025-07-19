/**
 * Tier 1 Audits - Export Patterns Sub-module
 * Module.exports structure and grouping validation
 */

const fs = require('fs').promises;

const { loadAuditConfig, getFlattenedPatterns } = require('../config-loader');

/**
 * Audit export patterns compliance
 * @purpose Validates module.exports structure and grouping
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditExportPatterns(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Load export organization configuration
  const exportConfig = await loadAuditConfig('exportOrganization');

  // Skip files that don't export anything
  if (!content.includes('module.exports')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Must use object-style exports for multiple exports
  const multipleExportPattern = /module\.exports\s*=\s*{\s*[\s\S]*?}/;
  const hasMultipleExports = content.match(multipleExportPattern);

  // Rule 2: No mixed export patterns
  const exportLines = content.split('\n').filter((line) => {
    const trimmedLine = line.trim();
    // Only count actual export assignments, not strings or comments
    return (
      /^\s*module\.exports\s*=/.test(line) &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('*')
    );
  });
  if (exportLines.length > 1) {
    issues.push('Multiple module.exports statements found. Use single object export pattern.');
  }

  // Rule 3: Export organization comments (for files with multiple exports)
  if (hasMultipleExports) {
    const exportBlock = hasMultipleExports[0];

    // Get patterns from external config
    const workflowPatterns = getFlattenedPatterns(exportConfig, 'workflowComments.patterns');
    const operationPatterns = getFlattenedPatterns(exportConfig, 'operationComments.patterns');

    const hasWorkflowComment = workflowPatterns.some((pattern) => exportBlock.includes(pattern));
    const hasOperationComment = operationPatterns.some((pattern) => exportBlock.includes(pattern));

    // Only flag if exports are complex enough to warrant organization
    const exportCount = (exportBlock.match(/^\s*\w+[,\s]*$/gm) || []).length;
    const complexityThreshold = exportConfig.complexityThreshold.value;

    if (exportCount >= complexityThreshold && !hasWorkflowComment && !hasOperationComment) {
      issues.push(
        'Complex exports (6+ functions) should include organization comments (// Business workflows, // Feature operations, etc.)'
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

module.exports = {
  auditExportPatterns,
};
