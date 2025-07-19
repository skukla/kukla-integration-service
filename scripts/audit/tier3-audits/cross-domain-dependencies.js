/**
 * Tier 3 Audits - Cross-Domain Dependencies Sub-module
 * All cross-domain dependency analysis and validation utilities
 */

const fs = require('fs');

// Cross-Domain Analysis Workflows

/**
 * Flag cross-domain dependencies for manual review
 * @purpose Check cross-domain imports while recognizing legitimate Feature-First DDD patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagCrossDomainDependencies(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Extract domain from file path
  if (!filePath.startsWith('src/')) {
    return { passed: true, issues: [] };
  }

  const pathParts = filePath.split('/');
  const currentDomain = pathParts[1];

  if (currentDomain === 'shared') {
    return { passed: true, issues: [] };
  }

  // Define legitimate cross-domain patterns in Feature-First DDD
  const legitimateCrossDomainPatterns = getLegitimatePatterns();

  // Find cross-domain imports
  const crossDomainPattern = /require\(['"]\.\.\/(\w+)\//g;
  let match;

  while ((match = crossDomainPattern.exec(content)) !== null) {
    const importedDomain = match[1];

    // Skip intra-domain subdirectory imports (e.g., files/shared -> files/utils)
    if (isIntraDomainImport(filePath, importedDomain)) {
      continue;
    }

    if (importedDomain !== currentDomain && importedDomain !== 'shared') {
      // Check if this is a legitimate cross-domain pattern
      const allowedDomains = legitimateCrossDomainPatterns[currentDomain] || [];

      if (!allowedDomains.includes(importedDomain)) {
        issues.push(
          `Unexpected cross-domain dependency: ${currentDomain} → ${importedDomain} (verify this interface is intentional)`
        );
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

// Cross-Domain Analysis Utilities

/**
 * Get legitimate cross-domain patterns for Feature-First DDD
 * @purpose Define expected cross-domain relationships in the architecture
 * @returns {Object} Map of domain to allowed dependency domains
 */
function getLegitimatePatterns() {
  return {
    products: ['commerce', 'files', 'shared'], // Products needs Commerce for data, Files for storage
    htmx: ['files', 'shared'], // HTMX needs Files for browser UI
    files: ['shared'], // Files can use shared utilities
    commerce: ['shared'], // Commerce can use shared utilities
    testing: ['products', 'files', 'commerce', 'shared'], // Testing validates all domains
    actions: ['products', 'files', 'htmx', 'commerce', 'testing', 'shared'], // Actions orchestrate all domains
  };
}

/**
 * Check if import is within the same domain (intra-domain subdirectory)
 * @purpose Distinguish between cross-domain imports and intra-domain subdirectory navigation
 * @param {string} filePath - Current file path being analyzed
 * @param {string} importedPath - The imported path segment
 * @returns {boolean} True if this is an intra-domain import
 */
function isIntraDomainImport(filePath, importedPath) {
  // Extract the current domain from file path
  const pathParts = filePath.split('/');
  const currentDomain = pathParts[1];

  // Common intra-domain subdirectories
  const intraDomainDirs = ['utils', 'operations', 'workflows', 'strategies'];

  // Check if we're importing from a subdirectory within the same domain
  return intraDomainDirs.includes(importedPath) && filePath.startsWith(`src/${currentDomain}/`);
}

module.exports = {
  flagCrossDomainDependencies,
};
