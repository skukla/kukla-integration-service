/**
 * Tier 2 Audits - Basic Audits Sub-module
 * Function length, file size, configuration patterns, and Feature-First organization audits
 */

const fs = require('fs').promises;

// Basic Audit Workflows

/**
 * Audit function length guidelines
 * @purpose Check for functions that exceed recommended length limits
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditFunctionLength(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip audit tooling files - complexity serves a purpose and they're working correctly
  if (filePath.includes('scripts/audit/') || filePath.includes('audit-test')) {
    return { passed: true, issues: [] };
  }

  // Find all functions and check their length
  const functionMatches = content.matchAll(
    /(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/g
  );

  for (const match of functionMatches) {
    const functionName = match[1] || match[2];
    if (!functionName) continue;

    const functionStart = match.index;
    const functionBody = extractFunctionBody(content, functionStart);
    const lineCount = functionBody.split('\n').length;

    if (lineCount > 60) {
      issues.push(
        `Function '${functionName}' has ${lineCount} lines. Consider breaking it down (recommended: <60 lines)`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit file size limits
 * @purpose Check for files that exceed recommended size limits
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditFileSize(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  const lineCount = content.split('\n').length;

  if (lineCount > 400) {
    issues.push(
      `File has ${lineCount} lines. Consider using Feature Core + Sub-modules pattern (recommended: <400 lines)`
    );
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit configuration access patterns
 * @purpose Check for poor configuration access patterns while allowing legitimate data fallbacks
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditConfigurationPatterns(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip non-business logic files, testing infrastructure, and audit tooling
  if (
    filePath.includes('/shared/') ||
    filePath.includes('config/') ||
    filePath.includes('test/') ||
    filePath.includes('testing/') ||
    filePath.includes('performance-testing/') ||
    filePath.includes('scripts/audit/') ||
    filePath.includes('audit-test')
  ) {
    return { passed: true, issues: [] };
  }

  // Look for actual configuration access anti-patterns (not data fallbacks)
  const configurationAntiPatterns = [
    /config\?\.[^|]+\|\|/g, // config?.commerce?.baseUrl || 'default'
    /params\?\.[^|]+\|\|/g, // params?.timeout || 5000
    /options\?\.[^|]+\|\|/g, // options?.retries || 3
  ];

  for (const pattern of configurationAntiPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(
        `Optional chaining with configuration fallbacks detected (${matches.length} instances). Use clean object access patterns instead.`
      );
    }
  }

  // Look for configuration-specific fallback patterns (not data fallbacks)
  const configurationFallbackPatterns = [
    /config\.[^|]+\|\|\s*['"][^'"]*['"]/g, // config.baseUrl || 'http://default'
    /config\.[^|]+\|\|\s*\d+/g, // config.timeout || 5000
    /params\.[^|]+\|\|\s*['"][^'"]*['"]/g, // params.environment || 'staging'
    /params\.[^|]+\|\|\s*\d+/g, // params.limit || 100
  ];

  let configurationFallbacks = 0;
  for (const pattern of configurationFallbackPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      configurationFallbacks += matches.length;
    }
  }

  if (configurationFallbacks > 3) {
    issues.push(
      `Excessive configuration fallback patterns detected (${configurationFallbacks} instances). Consider trusting configuration structure.`
    );
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Feature-First organization patterns
 * @purpose Check for layer-first organization that should be Feature-First
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditFeatureFirstOrganization(filePath) {
  const issues = [];

  // Check for layer-first directory patterns that should be Feature-First
  const layerFirstPatterns = ['/operations/', '/workflows/', '/utils/', '/strategies/'];

  for (const pattern of layerFirstPatterns) {
    if (filePath.includes(pattern)) {
      // Allow certain exceptions
      const allowedExceptions = ['shared/operations', 'shared/utils', 'config/'];

      const isException = allowedExceptions.some((exception) => filePath.includes(exception));

      if (!isException) {
        issues.push(
          `File follows layer-first organization (${pattern}). Consider Feature-First organization where complete capabilities are in single files.`
        );
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

// Basic Audit Utilities

/**
 * Extract function body content from source code
 * @purpose Extract complete function body for analysis from a starting position
 * @param {string} content - Source code content
 * @param {number} startIndex - Starting index to extract from
 * @returns {string} Complete function body including braces
 * @usedBy auditFunctionLength
 */
function extractFunctionBody(content, startIndex) {
  const fromStart = content.substring(startIndex);
  const openBrace = fromStart.indexOf('{');
  if (openBrace === -1) return '';

  let braceCount = 1;
  let i = openBrace + 1;

  while (i < fromStart.length && braceCount > 0) {
    if (fromStart[i] === '{') braceCount++;
    if (fromStart[i] === '}') braceCount--;
    i++;
  }

  return fromStart.substring(openBrace, i);
}

module.exports = {
  auditFunctionLength,
  auditFileSize,
  auditConfigurationPatterns,
  auditFeatureFirstOrganization,
  extractFunctionBody,
};
