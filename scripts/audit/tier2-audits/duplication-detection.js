/**
 * Tier 2 Audits - Duplication Detection Sub-module
 * Cross-domain function duplication, validation, and response building pattern detection
 */

const fs = require('fs').promises;

// Duplication Detection Workflows

/**
 * Audit cross-domain function duplication
 * @purpose Check for functions that should be shared across domains
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

  // Actual duplication patterns (not domain-specific implementations)
  const duplicatedPatterns = [
    'validateParams',
    'validateConfig',
    'buildErrorResponse',
    'buildSuccessResponse',
    'formatOutput',
    'normalizeData',
  ];

  // Domain-specific patterns that are legitimate (exclude from duplication check)
  const legitimateDomainPatterns = [
    'executeRequestWithAuthRetry', // Commerce-specific auth retry
    'makeMeshRequestWithRetry', // Mesh-specific API retry
    'executeRequest', // Generic - each domain may have specific needs
    'enrichData', // Domain-specific enrichment logic
    'validateRequest', // Domain-specific validation rules
  ];

  const functionNames = extractFunctionNames(content);

  for (const pattern of duplicatedPatterns) {
    const matchingFunctions = functionNames.filter(
      (name) =>
        name.toLowerCase().includes(pattern.toLowerCase()) &&
        !legitimateDomainPatterns.some((legitPattern) =>
          name.toLowerCase().includes(legitPattern.toLowerCase())
        )
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
 * @purpose Detect validation functions that might be consolidated
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

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  if (!domainMatch) {
    return { passed: true, issues: [] };
  }
  const currentDomain = domainMatch[1];

  // Common validation patterns that might be duplicated
  const validationPatterns = [
    'validateProductFields',
    'validateExportParams',
    'validateConfiguration',
    'validateApiResponse',
    'validateFileContent',
    'validateUserInput',
  ];

  const functionNames = extractFunctionNames(content);

  for (const pattern of validationPatterns) {
    const matchingFunctions = functionNames.filter((name) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingFunctions.length > 0) {
      issues.push(
        `Validation pattern in ${currentDomain}: '${matchingFunctions.join(', ')}' might benefit from shared validation utilities`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit response building duplication
 * @purpose Detect response building patterns that should use shared utilities
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier2Audits
 */
async function auditResponseBuildingDuplication(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  const validationResult = validateFileForResponseAudit(filePath);
  if (!validationResult.shouldAudit) {
    return { passed: true, issues: [] };
  }

  const currentDomain = validationResult.domain;

  if (usesSharedResponseUtilities(content)) {
    return { passed: true, issues: [] };
  }

  // Check for actual HTTP response building
  if (hasHttpResponseBuilding(content)) {
    issues.push(
      `Manual response building in ${currentDomain} - consider using shared response utilities from shared/http/responses or domain operations/response-building`
    );
  }

  // Check for response building function names
  const functionIssues = checkResponseBuildingFunctions(content, currentDomain);
  issues.push(...functionIssues);

  return { passed: issues.length === 0, issues };
}

/**
 * Validate if file should be audited for response building
 * @purpose Check if file is eligible for response building audit
 * @param {string} filePath - Path to file being audited
 * @returns {Object} Validation result with shouldAudit flag and domain
 */
function validateFileForResponseAudit(filePath) {
  if (!filePath.startsWith('src/') || filePath.includes('/shared/')) {
    return { shouldAudit: false };
  }

  const domainMatch = filePath.match(/src\/([^/]+)\//);
  if (!domainMatch) {
    return { shouldAudit: false };
  }

  return { shouldAudit: true, domain: domainMatch[1] };
}

/**
 * Check if file uses shared response utilities
 * @purpose Determine if file already uses shared response patterns
 * @param {string} content - File content to check
 * @returns {boolean} True if file uses shared response utilities
 */
function usesSharedResponseUtilities(content) {
  return (
    content.includes("require('../../shared/http/responses')") ||
    content.includes("require('../shared/response-building')") ||
    content.includes('response.success') ||
    content.includes('response.error') ||
    content.includes('response.html')
  );
}

/**
 * Check if content has HTTP response building patterns
 * @purpose Detect actual HTTP response building vs test data
 * @param {string} content - File content to analyze
 * @returns {boolean} True if content has HTTP response building
 */
function hasHttpResponseBuilding(content) {
  const httpResponsePatterns = getHttpResponsePatterns();

  for (const pattern of httpResponsePatterns) {
    if (pattern.test(content)) {
      const returnMatches = extractReturnStatements(content);
      const actualResponses = filterActualHttpResponses(returnMatches);

      if (actualResponses.length > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get HTTP response regex patterns
 * @purpose Define patterns that match HTTP response return statements
 * @returns {Array} Array of regex patterns for HTTP responses
 */
function getHttpResponsePatterns() {
  return [
    /return\s*\{\s*statusCode:\s*\d+.*?headers:\s*\{.*?body:/s,
    /return\s*\{\s*headers:\s*\{.*?statusCode:\s*\d+.*?body:/s,
    /return\s*\{\s*[\s\S]*?statusCode:\s*\d+[\s\S]*?headers:\s*\{[\s\S]*?'Content-Type'[\s\S]*?\}/s,
  ];
}

/**
 * Extract return statements from content
 * @purpose Find all return statement blocks in the content
 * @param {string} content - File content to analyze
 * @returns {Array} Array of return statement strings
 */
function extractReturnStatements(content) {
  return content.match(/return\s*\{[^}]*\}/gs) || [];
}

/**
 * Filter actual HTTP responses from return statements
 * @purpose Distinguish HTTP responses from test data and request options
 * @param {Array} returnMatches - Array of return statement strings
 * @returns {Array} Array of actual HTTP response return statements
 */
function filterActualHttpResponses(returnMatches) {
  return returnMatches.filter((returnStatement) => {
    const hasHttpFields =
      returnStatement.includes('statusCode:') &&
      returnStatement.includes('headers:') &&
      (returnStatement.includes('body:') || returnStatement.includes('Content-Type'));

    if (!hasHttpFields) return false;

    // Filter out test results and request options
    const lowerStatement = returnStatement.toLowerCase();
    return (
      !lowerStatement.includes('test') &&
      !lowerStatement.includes('mock') &&
      !lowerStatement.includes('request') &&
      !lowerStatement.includes('options') &&
      !lowerStatement.includes('result')
    );
  });
}

/**
 * Check for response building function names
 * @purpose Detect functions that should use shared response patterns
 * @param {string} content - File content to analyze
 * @param {string} currentDomain - Current domain being audited
 * @returns {Array} Array of issues found
 */
function checkResponseBuildingFunctions(content, currentDomain) {
  const issues = [];
  const responseBuildingPatterns = [
    'buildResponse',
    'buildSuccessResponse',
    'buildErrorResponse',
    'createResponse',
    'formatResponse',
    'buildStorageResponse',
  ];

  const functionNames = extractFunctionNames(content);

  for (const pattern of responseBuildingPatterns) {
    const matchingFunctions = functionNames.filter((name) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingFunctions.length > 0) {
      issues.push(
        `Response building functions in ${currentDomain}: '${matchingFunctions.join(', ')}' should use shared response building patterns`
      );
    }
  }

  return issues;
}

// Duplication Detection Utilities

/**
 * Extract function names from source code content
 * @purpose Extract all function names from content for duplication analysis
 * @param {string} content - Source code content to analyze
 * @returns {Array<string>} Array of unique function names found
 * @usedBy auditCrossDomainFunctionDuplication, auditValidationPatternDuplication, auditResponseBuildingDuplication
 */
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
  auditCrossDomainFunctionDuplication,
  auditValidationPatternDuplication,
  auditResponseBuildingDuplication,
  extractFunctionNames,
};
