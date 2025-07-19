/**
 * Tier 2 Audits - Utility Opportunities Sub-module
 * Shared utility opportunity detection and extraction recommendations
 */

const fs = require('fs').promises;

// Utility Opportunity Detection Workflows

/**
 * Audit shared utility opportunities
 * @purpose Identify utilities that could be shared across domains
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditSharedUtilityOpportunities(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  if (!filePath.startsWith('src/') || filePath.includes('/shared/')) {
    return { passed: true, issues: [] };
  }

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  if (!domainMatch) {
    return { passed: true, issues: [] };
  }
  const currentDomain = domainMatch[1];

  // Look for utilities commonly needed across domains (exclude domain-specific patterns)
  const commonUtilities = [
    // HTTP and networking
    'request',
    'fetch',
    'axios',
    'buildActionUrl',
    'buildCommerceApiUrl',

    // Data processing
    'filter',
    'map',
    'reduce',
  ];

  // Domain-specific patterns that should NOT be shared
  const domainSpecificPatterns = [
    'executeRequestWithAuthRetry', // Commerce-specific auth retry
    'executeAdminTokenRequest', // Commerce-specific authentication
    'makeMeshRequestWithRetry', // Mesh-specific retry logic
    'validateStorageAccess', // Files-specific validation
    'executeRequest', // Too generic - each domain has specific needs
  ];

  const functionNames = extractFunctionNamesFromContent(content);

  for (const pattern of commonUtilities) {
    const matchingFunctions = functionNames.filter(
      (name) =>
        (name === pattern || name.toLowerCase().includes(pattern.toLowerCase())) &&
        !domainSpecificPatterns.some((domainPattern) =>
          name.toLowerCase().includes(domainPattern.toLowerCase())
        )
    );

    if (matchingFunctions.length > 0) {
      issues.push(
        `Shared utility opportunity in ${currentDomain}: '${matchingFunctions.join(', ')}' might be useful across domains`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

// Utility Opportunity Detection Utilities

/**
 * Extract function names from source code content
 * @purpose Extract all function names from content for utility analysis
 * @param {string} content - Source code content to analyze
 * @returns {Array<string>} Array of unique function names found
 * @usedBy auditSharedUtilityOpportunities
 */
function extractFunctionNamesFromContent(content) {
  const functionPatterns = [
    /(?:async\s+)?function\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*{|function)/g,
  ];

  const functionNames = [];

  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const functionName = match[1];
      if (functionName && !['module', 'require', 'exports'].includes(functionName)) {
        functionNames.push(functionName);
      }
    }
  }

  return [...new Set(functionNames)];
}

module.exports = {
  auditSharedUtilityOpportunities,
  extractFunctionNamesFromContent,
};
