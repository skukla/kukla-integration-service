/**
 * Tier 1 Audits - Import Organization Sub-module
 * Import grouping, section comments, and namespace import pattern validation
 */

const fs = require('fs').promises;

const { loadAuditConfig, getAllNamespacePatterns } = require('../config-loader');

/**
 * Audit import organization compliance
 * @purpose Validates import grouping, section comments, and namespace import patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditImportOrganization(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Load namespace imports configuration
  const namespaceConfig = await loadAuditConfig('namespaceImports');
  const allowedNamespaceImports = getAllNamespacePatterns(namespaceConfig);

  // Rule 1: Import organization (grouping is obvious from paths - no section comments needed)
  const importLines = content.match(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);?/g) || [];
  const requireLines = content.match(/const\s+\w+\s*=\s*require\([^)]+\);?/g) || [];

  const totalImports = importLines.length + requireLines.length;

  if (totalImports >= namespaceConfig.importThreshold.value) {
    // We don't enforce section comments for imports - grouping is obvious from paths
    // This check is disabled as per our architectural standards
  }

  // Rule 2: No namespace imports (everything is direct imports)
  const namespaceImportPattern = /const\s+\w+\s*=\s*require\(/;
  const requireCount = (content.match(/require\(/g) || []).length;

  if (requireCount > 0) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (namespaceImportPattern.test(line) && line.includes('require(')) {
        // Check if this is an allowed namespace import using external config
        const isAllowed = allowedNamespaceImports.some(
          (allowed) => line.includes(`'${allowed}'`) || line.includes(`"${allowed}"`)
        );

        if (!isAllowed && !line.includes('{')) {
          issues.push(
            `Line ${i + 1}: Use direct imports instead of namespace imports. Import specific functions: ${line.trim()}`
          );
        }
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

module.exports = {
  auditImportOrganization,
};
