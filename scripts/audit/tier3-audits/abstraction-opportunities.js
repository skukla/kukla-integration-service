/**
 * Tier 3 Audits - Abstraction Opportunities Sub-module
 * All code duplication analysis and abstraction opportunity detection utilities
 */

const fs = require('fs');

// Abstraction Analysis Workflows

/**
 * Flag abstraction opportunities for manual review
 * @purpose Check for potential code duplication while excluding legitimate config patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagAbstractionOpportunities(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Skip config files and test data - repetition is expected
  const fileContext = analyzeFileContext(filePath);

  // Look for repeated patterns (exclude config files)
  const functionNames = extractFunctionNames(content);

  // Check for similar function names (potential duplication) - business logic only
  if (!fileContext.isConfigFile && !fileContext.isTestFile) {
    const functionIssues = analyzeSimilarFunctionNames(functionNames);
    issues.push(...functionIssues);
  }

  // Look for repeated string literals (exclude config and test files)
  if (!fileContext.isConfigFile && !fileContext.isTestFile && !fileContext.isDataFile) {
    const stringIssues = analyzeRepeatedStringLiterals(content);
    issues.push(...stringIssues);
  }

  return { passed: issues.length === 0, issues };
}

// Abstraction Analysis Utilities

/**
 * Analyze file context to determine appropriate analysis rules
 * @purpose Categorize files to apply appropriate abstraction analysis
 * @param {string} filePath - Path to file being analyzed
 * @returns {Object} File context analysis result
 */
function analyzeFileContext(filePath) {
  return {
    isConfigFile: filePath.includes('config/') || filePath.includes('domains/'),
    isTestFile: filePath.includes('test') || filePath.includes('audit-test'),
    isDataFile: filePath.includes('scenarios') || filePath.includes('test-data'),
  };
}

/**
 * Extract function names from content
 * @purpose Find all function declarations in the content
 * @param {string} content - File content to analyze
 * @returns {Array} Array of function names
 */
function extractFunctionNames(content) {
  return (content.match(/function\s+(\w+)/g) || []).map((match) => match.split(' ')[1]);
}

/**
 * Analyze similar function names for potential duplication
 * @purpose Detect functions that might be doing similar work
 * @param {Array} functionNames - Array of function names to analyze
 * @returns {Array} Array of issues found
 */
function analyzeSimilarFunctionNames(functionNames) {
  const issues = [];
  const similarNames = {};

  functionNames.forEach((name) => {
    const root = name.replace(/(Process|Workflow|Handler|Util|Helper)$/, '');
    if (root.length > 3) {
      similarNames[root] = (similarNames[root] || 0) + 1;
    }
  });

  Object.entries(similarNames).forEach(([root, count]) => {
    if (count > 2) {
      issues.push(
        `Similar function names detected (${root}*) - consider consolidating if logic is similar`
      );
    }
  });

  return issues;
}

/**
 * Analyze repeated string literals for extraction opportunities
 * @purpose Find string literals that appear multiple times and could be constants
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeRepeatedStringLiterals(content) {
  const issues = [];
  const stringLiterals = content.match(/'[^']{15,}'/g) || []; // Only longer strings
  const repeatedStrings = {};

  stringLiterals.forEach((str) => {
    // Exclude common patterns that shouldn't be abstracted
    if (shouldExcludeStringLiteral(str)) {
      return;
    }
    repeatedStrings[str] = (repeatedStrings[str] || 0) + 1;
  });

  Object.entries(repeatedStrings).forEach(([str, count]) => {
    if (count >= 3) {
      const preview = str.substring(0, 50) + (str.length > 50 ? '...' : '');
      issues.push(
        `Repeated string literal found ${count} times: '${preview} - consider extracting to constant`
      );
    }
  });

  return issues;
}

/**
 * Check if string literal should be excluded from abstraction analysis
 * @purpose Filter out common patterns that shouldn't be extracted
 * @param {string} str - String literal to check
 * @returns {boolean} True if string should be excluded
 */
function shouldExcludeStringLiteral(str) {
  const excludePatterns = [
    // Config/data patterns
    'description:',
    'target:',
    'severity:',
    'enabled:',
    'success: true',
    'error:',

    // Code structure patterns (shouldn't be abstracted)
    ')) {', // Control flow patterns
    '}) {', // Function/conditional patterns
    '}); ', // Callback patterns
    ') ||', // Logical operator patterns
    ') {', // General conditional patterns
    '.push(', // Array push patterns
    '.includes(', // Includes check patterns
    'console.log(', // Logging patterns
    '.log(', // Logging patterns
    ' = ', // Assignment patterns

    // CLI/script infrastructure patterns
    '{ flag:', // CLI flag patterns
    '{ command:', // CLI command patterns
    'args.includes', // Argument checking patterns
    'healthReport', // Health monitoring patterns
    'recommendations', // Recommendation patterns
  ];

  return excludePatterns.some((pattern) => str.includes(pattern));
}

module.exports = {
  flagAbstractionOpportunities,
};
