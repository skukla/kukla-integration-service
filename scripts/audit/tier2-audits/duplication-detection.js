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

/**
 * Audit URL construction duplication patterns
 * @purpose Detect manual URL concatenation, legacy URL building functions, and enforce URL factory pattern
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result for URL construction patterns
 * @usedBy executeTier2Audits
 */
async function auditUrlConstructionDuplication(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Run all URL construction checks
  issues.push(...checkManualUrlConcatenation(content));
  issues.push(...checkDirectInfrastructureUsage(content));
  issues.push(...checkConfigRepetition(content));
  issues.push(...checkLegacyUrlFunctions(content));
  issues.push(...checkHardcodedEndpoints(content));
  issues.push(...checkUrlFactoryUsage(content, filePath));

  return { passed: issues.length === 0, issues };
}

/**
 * Check for manual URL concatenation patterns
 * @purpose Detect manual URL building with string concatenation
 * @param {string} content - File content to analyze
 * @returns {Array} Issues found
 */
function checkManualUrlConcatenation(content) {
  const issues = [];
  const patterns = [
    /\+\s*[`'"]\?.*encodeURIComponent/g,
    /[`'"].*[`'"]\s*\+\s*[`'"]\?/g,
    /buildRuntimeUrl.*\+.*[`'"]\?/g,
    /buildActionUrl.*\+.*[`'"]\?/g,
  ];

  patterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(
        `Manual URL concatenation detected - use URL factory pattern instead: ${matches[0].substring(0, 50)}...`
      );
    }
  });

  return issues;
}

/**
 * Check for excessive config repetition
 * @purpose Detect excessive config passing in URL building
 * @param {string} content - File content to analyze
 * @returns {Array} Issues found
 */
function checkConfigRepetition(content) {
  const issues = [];

  // Only flag config repetition in non-infrastructure files
  // Infrastructure files legitimately pass config
  const patterns = [/\w+Url\([^)]*config[^)]*\)/g, /build\w+\([^)]*config[^)]*\)/g];

  patterns.forEach((pattern) => {
    const matches = content.match(pattern);
    // Increase threshold and add context check
    if (matches && matches.length >= 8) {
      // Check if this looks like a business workflow (not infrastructure)
      const hasBusinessContext =
        content.includes('Step 1:') || content.includes('Business Workflows');
      if (hasBusinessContext) {
        issues.push(
          `Excessive config repetition in URL building detected (${matches.length} instances) - consider using URL factory pattern`
        );
      }
    }
  });

  return issues;
}

/**
 * Check for legacy URL building functions
 * @purpose Detect deprecated URL building functions
 * @param {string} content - File content to analyze
 * @returns {Array} Issues found
 */
function checkLegacyUrlFunctions(content) {
  const issues = [];
  // Only flag actual legacy functions, not current infrastructure
  const patterns = [/buildCommerceUrl\(/g, /getActionUrl\(/g];

  patterns.forEach((pattern) => {
    if (content.match(pattern)) {
      issues.push(
        'Legacy URL building function detected - use createUrlBuilders() factory pattern instead'
      );
    }
  });

  return issues;
}

/**
 * Check for hardcoded API endpoints
 * @purpose Detect hardcoded endpoint patterns
 * @param {string} content - File content to analyze
 * @returns {Array} Issues found
 */
function checkHardcodedEndpoints(content) {
  const issues = [];
  const patterns = [/['"`]\/rest\/V1\/\w+['"`]/g, /endpointMap\s*=\s*{/g];

  patterns.forEach((pattern) => {
    if (content.match(pattern)) {
      issues.push(
        'Hardcoded API endpoints detected - use createUrlBuilders() factory with commerceUrl() instead'
      );
    }
  });

  return issues;
}

/**
 * Check for proper URL factory usage
 * @purpose Detect files that should use URL factory pattern
 * @param {string} content - File content to analyze
 * @param {string} filePath - File path for context
 * @returns {Array} Issues found
 */
function checkUrlFactoryUsage(content, filePath) {
  const issues = [];

  const isInfrastructureFile =
    filePath.includes('/shared/routing/') ||
    filePath.includes('/shared/url') ||
    filePath.includes('/audit/') ||
    filePath.includes('/templates/');

  const isNonBuildingFile =
    filePath.includes('/formatting.js') ||
    filePath.includes('/validation/') ||
    filePath.includes('/monitor/') ||
    filePath.includes('/presigned-urls.js');

  if (
    !isInfrastructureFile &&
    !isNonBuildingFile &&
    content.includes('Url(') &&
    !content.includes('createUrlBuilders')
  ) {
    const hasUrlBuilding = /\w*[Uu]rl\s*\(/g.test(content);
    const hasUrlVariables = /\w*[Uu]rl\s*=/g.test(content);

    if (hasUrlBuilding && !hasUrlVariables) {
      issues.push(
        "URL building detected without factory pattern - use createUrlBuilders() from '../shared/routing/url-factory'"
      );
    }
  }

  return issues;
}

/**
 * Check for direct infrastructure usage
 * @purpose Detect direct calls to infrastructure URL functions
 * @param {string} content - File content to analyze
 * @returns {Array} Issues found
 */
function checkDirectInfrastructureUsage(content) {
  const issues = [];

  // Only flag infrastructure usage in application files, not infrastructure files themselves
  const infrastructurePatterns = [
    /buildActionUrl\s*\(/g,
    /buildCommerceApiUrl\s*\(/g,
    /buildProductsEndpoint\s*\(/g,
    /buildStockItemEndpoint\s*\(/g,
  ];

  // Skip if this looks like an infrastructure file
  const isInfrastructureFile =
    content.includes('module.exports = {') &&
    (content.includes('buildActionUrl') ||
      content.includes('buildCommerceApiUrl') ||
      content.includes('buildProductsEndpoint') ||
      content.includes('buildStockItemEndpoint'));

  if (!isInfrastructureFile) {
    infrastructurePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out function declarations - only flag actual calls
        const actualCalls = matches.filter((match) => {
          // Find the full line containing this match
          const lines = content.split('\n');
          const matchingLine = lines.find((line) => line.includes(match));

          // Skip if it's a function declaration
          return matchingLine && !matchingLine.trim().startsWith('function ');
        });

        if (actualCalls.length > 0) {
          issues.push(
            'Direct infrastructure URL usage detected - use createUrlBuilders() factory pattern instead'
          );
        }
      }
    });
  }

  return issues;
}

// Duplication Detection Utilities

/**
 * Extract function names from file content
 * @purpose Parse file content to identify all function declarations and expressions
 * @param {string} content - File content to parse
 * @returns {Array<string>} Array of unique function names found in the content
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
  auditUrlConstructionDuplication,
  extractFunctionNames,
};
