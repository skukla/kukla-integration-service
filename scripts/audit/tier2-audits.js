/**
 * App Audit - Tier 2 Audits Sub-module
 * Pattern detection audit rules (70-90% accurate) - Used for warnings
 */

const fs = require('fs').promises;

const format = require('../shared/formatting');

// Tier 2 Audit Workflows

/**
 * Execute Tier 2 audits - Pattern detection with moderate reliability
 * @purpose Execute pattern detection audits that are 70-90% accurate
 * @param {Array<string>} files - Files to audit
 * @param {Object} results - Results object to populate
 * @returns {Promise<void>} Updates results object with tier 2 audit results
 * @usedBy app-audit.js auditAppWithAllComponents
 */
async function executeTier2Audits(files, results) {
  const tier2Rules = [
    { name: 'function-length-guidelines', fn: auditFunctionLength },
    { name: 'file-size-limits', fn: auditFileSize },
    { name: 'configuration-access-patterns', fn: auditConfigurationPatterns },
    { name: 'feature-first-organization', fn: auditFeatureFirstOrganization },
    { name: 'cross-domain-function-duplication', fn: auditCrossDomainFunctionDuplication },
    { name: 'validation-pattern-duplication', fn: auditValidationPatternDuplication },
    { name: 'response-building-duplication', fn: auditResponseBuildingDuplication },
    { name: 'shared-utility-opportunities', fn: auditSharedUtilityOpportunities },
  ];

  for (const rule of tier2Rules) {
    console.log(format.subInfo(rule.name));

    for (const file of files) {
      try {
        const ruleResult = await rule.fn(file);
        if (ruleResult.passed) {
          results.passed++;
        } else {
          results.failed++;
          results.details.push({
            rule: rule.name,
            file,
            issues: ruleResult.issues,
            severity: 'warning',
          });
        }
      } catch (error) {
        // Tier 2 errors are warnings, not failures
        results.details.push({
          rule: rule.name,
          file,
          issues: [`Pattern detection error: ${error.message}`],
          severity: 'info',
        });
      }
    }
  }
}

// Tier 2 Audit Operations

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
 * @purpose Check for optional chaining with fallbacks (config?.foo?.bar || default)
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditConfigurationPatterns(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Rule 1: No optional chaining with fallback patterns
  const optionalChainingPattern = /\w+\?\.\w+(\?\.\w+)*\s*\|\|/g;
  let match;

  while ((match = optionalChainingPattern.exec(content)) !== null) {
    const line = content.split('\n')[content.substring(0, match.index).split('\n').length - 1];
    issues.push(`Avoid optional chaining with fallbacks in business logic: ${line.trim()}`);
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

// Duplication Detection Operations

/**
 * Audit cross-domain function duplication
 * @purpose Detect similar function names across different domains
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditCrossDomainFunctionDuplication(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip shared files and non-domain files
  if (!filePath.startsWith('src/') || filePath.includes('/shared/')) {
    return { passed: true, issues: [] };
  }

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  if (!domainMatch) {
    return { passed: true, issues: [] };
  }
  const currentDomain = domainMatch[1];

  // Common duplicated function patterns
  const duplicatedPatterns = [
    'validateRequest',
    'validateParams',
    'validateConfig',
    'buildResponse',
    'buildErrorResponse',
    'buildSuccessResponse',
    'executeRequest',
    'formatOutput',
    'normalizeData',
    'enrichData',
  ];

  const functionNames = extractFunctionNames(content);

  for (const pattern of duplicatedPatterns) {
    const matchingFunctions = functionNames.filter((name) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingFunctions.length > 0) {
      issues.push(
        `Potential cross-domain duplication: ${currentDomain} contains '${matchingFunctions.join(', ')}' - check if similar functions exist in other domains`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit validation pattern duplication
 * @purpose Detect duplicated validation logic across domains
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditValidationPatternDuplication(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  if (!filePath.startsWith('src/') || filePath.includes('/shared/')) {
    return { passed: true, issues: [] };
  }

  const validationPatterns = [
    /validateProductData/g,
    /validateProducts\(/g,
    /validateRequiredFields/g,
    /validateParameters/g,
    /validateFileName/g,
  ];

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  const currentDomain = domainMatch ? domainMatch[1] : 'unknown';

  for (const pattern of validationPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(
        `Validation duplication candidate in ${currentDomain}: Found '${pattern.source}' - verify if similar validation exists in other domains`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit response building duplication
 * @purpose Detect duplicated response building patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditResponseBuildingDuplication(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  if (!filePath.startsWith('src/') || filePath.includes('/shared/')) {
    return { passed: true, issues: [] };
  }

  const responsePatterns = [
    /buildStorageResponse/g,
    /buildSuccessResponse/g,
    /buildErrorResponse/g,
    /createAppBuilderPresignedUrlResponse/g,
  ];

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  const currentDomain = domainMatch ? domainMatch[1] : 'unknown';

  for (const pattern of responsePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(
        `Response building duplication in ${currentDomain}: Found '${pattern.source}' - ensure using unified response building patterns`
      );
    }
  }

  // Check for manual response construction
  if (
    content.includes('{ statusCode:') &&
    content.includes('headers:') &&
    content.includes('body:')
  ) {
    issues.push(
      `Manual response construction detected in ${currentDomain} - should use response utilities from shared/http/responses`
    );
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit shared utility opportunities
 * @purpose Identify functions that might belong in shared directories
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

  // Look for utilities commonly needed across domains
  const sharedUtilityPatterns = [
    'formatFileSize',
    'formatDate',
    'formatStepMessage',
    'executeRequest',
    'buildCommerceUrl',
    'buildRuntimeUrl',
    'createHttpClient',
    'retryWithBackoff',
  ];

  const functionNames = extractFunctionNames(content);

  for (const pattern of sharedUtilityPatterns) {
    const matchingFunctions = functionNames.filter(
      (name) => name === pattern || name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingFunctions.length > 0) {
      issues.push(
        `Shared utility opportunity in ${currentDomain}: '${matchingFunctions.join(', ')}' might be useful across domains`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

// Tier 2 Audit Utilities

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

function extractFunctionNames(content) {
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
  // Business workflows
  executeTier2Audits,

  // Feature operations
  auditFunctionLength,
  auditFileSize,
  auditConfigurationPatterns,
  auditFeatureFirstOrganization,
  auditCrossDomainFunctionDuplication,
  auditValidationPatternDuplication,
  auditResponseBuildingDuplication,
  auditSharedUtilityOpportunities,
};
