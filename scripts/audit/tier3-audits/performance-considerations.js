/**
 * Tier 3 Audits - Performance Considerations Sub-module
 * All performance analysis and optimization opportunity detection utilities
 */

const fs = require('fs');

// Performance Analysis Workflows

/**
 * Flag performance considerations for manual review
 * @purpose Check for potential performance issues while excluding legitimate script patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagPerformanceConsiderations(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Analyze file context for appropriate rules
  const fileContext = analyzeFileContext(filePath);

  // Look for nested loops that could be performance issues (exclude audit scripts)
  if (!fileContext.isAuditScript) {
    const nestedLoopIssues = analyzeNestedLoops(content);
    issues.push(...nestedLoopIssues);
  }

  // Look for synchronous file operations (exclude scripts and templates)
  if (!fileContext.isBuildScript && !fileContext.isTemplate && !fileContext.isHashScript) {
    const syncFileIssues = analyzeSyncFileOperations(content);
    issues.push(...syncFileIssues);
  }

  // Look for potential memory leaks (all files)
  const memoryLeakIssues = analyzeMemoryLeaks(content);
  issues.push(...memoryLeakIssues);

  // Look for inefficient array operations (business logic only)
  if (!fileContext.isAuditScript && !fileContext.isBuildScript) {
    const arrayOpIssues = analyzeInefficientArrayOperations(content);
    issues.push(...arrayOpIssues);
  }

  return { passed: issues.length === 0, issues };
}

// Performance Analysis Utilities

/**
 * Analyze file context to determine appropriate performance rules
 * @purpose Categorize files to apply appropriate performance analysis
 * @param {string} filePath - Path to file being analyzed
 * @returns {Object} File context analysis result
 */
function analyzeFileContext(filePath) {
  return {
    isAuditScript: filePath.includes('scripts/audit/') || filePath.includes('audit-test'),
    isBuildScript:
      filePath.includes('scripts/') &&
      (filePath.includes('build') || filePath.includes('deploy') || filePath.includes('monitor')),
    isTemplate: filePath.includes('template') || filePath.includes('.ejs'),
    isHashScript: filePath.includes('scripts/shared/hash.js'), // Hash scripts legitimately use sync operations
  };
}

/**
 * Analyze nested loops for performance issues
 * @purpose Detect nested loops that could impact performance with large datasets
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeNestedLoops(content) {
  const issues = [];
  const nestedLoopPattern = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g;

  if (nestedLoopPattern.test(content)) {
    issues.push('Nested loops detected - consider performance implications for large datasets');
  }

  return issues;
}

/**
 * Analyze synchronous file operations
 * @purpose Detect sync file operations that could block the event loop
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeSyncFileOperations(content) {
  const issues = [];
  const syncFileOps = ['readFileSync', 'writeFileSync', 'statSync'];

  syncFileOps.forEach((op) => {
    if (content.includes(op)) {
      issues.push(
        `Synchronous file operation '${op}' detected - consider using async version for better performance`
      );
    }
  });

  return issues;
}

/**
 * Analyze potential memory leaks
 * @purpose Detect patterns that could lead to memory leaks
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeMemoryLeaks(content) {
  const issues = [];

  if (content.includes('setInterval') && !content.includes('clearInterval')) {
    issues.push('setInterval usage detected without clearInterval - potential memory leak');
  }

  return issues;
}

/**
 * Analyze inefficient array operations
 * @purpose Detect array operation patterns that could be optimized
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeInefficientArrayOperations(content) {
  const issues = [];
  const inefficientPatterns = [
    {
      pattern: /\.forEach\([^)]*\)\s*\.\s*map\(/,
      message: 'forEach followed by map detected - consider using just map for better performance',
    },
    {
      pattern: /\.map\([^)]*\)\s*\.\s*filter\(/,
      message: 'map followed by filter detected - consider reversing order for better performance',
    },
  ];

  inefficientPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      issues.push(message);
    }
  });

  return issues;
}

module.exports = {
  flagPerformanceConsiderations,
};
