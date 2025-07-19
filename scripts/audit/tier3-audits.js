/**
 * App Audit - Tier 3 Audits Sub-module
 * Manual review flags (guidance only) - Used for suggestions
 */

const fs = require('fs');

const { subInfo } = require('../shared/formatting');

// Tier 3 Audit Workflows

/**
 * Execute Tier 3 audits - Manual review flags for guidance
 * @purpose Execute manual review audits that provide guidance and suggestions
 * @param {Array<string>} files - Files to audit
 * @param {Object} results - Results object to populate
 * @returns {Promise<void>} Updates results object with tier 3 audit results
 * @usedBy app-audit.js auditAppWithAllComponents
 */
async function executeTier3Audits(files, results) {
  const tier3Rules = [
    { name: 'cross-domain-dependencies', fn: flagCrossDomainDependencies },
    { name: 'abstraction-opportunities', fn: flagAbstractionOpportunities },
    { name: 'performance-considerations', fn: flagPerformanceConsiderations },
    { name: 'security-patterns', fn: flagSecurityPatterns },
  ];

  for (const rule of tier3Rules) {
    console.log(subInfo(rule.name));

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
            severity: 'info',
          });
        }
      } catch (error) {
        // Tier 3 errors are just informational
        results.details.push({
          rule: rule.name,
          file,
          issues: [`Manual review error: ${error.message}`],
          severity: 'info',
        });
      }
    }
  }
}

// Tier 3 Audit Operations

/**
 * Flag cross-domain dependencies that might violate DDD
 * @purpose Identify potential domain boundary violations
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

  // Find cross-domain imports
  const crossDomainPattern = /require\(['"]\.\.\/(\w+)\//g;
  let match;

  while ((match = crossDomainPattern.exec(content)) !== null) {
    const importedDomain = match[1];

    if (importedDomain !== currentDomain && importedDomain !== 'shared') {
      issues.push(
        `Cross-domain dependency: ${currentDomain} → ${importedDomain} (verify this interface is intentional)`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Flag potential abstraction opportunities
 * @purpose Identify repeated code patterns that could be abstracted
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagAbstractionOpportunities(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Look for repeated patterns
  const functionNames = (content.match(/function\s+(\w+)/g) || []).map(
    (match) => match.split(' ')[1]
  );

  // Check for similar function names (potential duplication)
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

  // Look for repeated string literals
  const stringLiterals = content.match(/'[^']{10,}'/g) || [];
  const repeatedStrings = {};

  stringLiterals.forEach((str) => {
    repeatedStrings[str] = (repeatedStrings[str] || 0) + 1;
  });

  Object.entries(repeatedStrings).forEach(([str, count]) => {
    if (count > 2) {
      issues.push(
        `Repeated string literal found ${count} times: ${str.substring(0, 50)}... - consider extracting to constant`
      );
    }
  });

  return { passed: issues.length === 0, issues };
}

/**
 * Flag performance considerations
 * @purpose Identify potential performance issues
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagPerformanceConsiderations(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Look for nested loops that could be performance issues
  const nestedLoopPattern = /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g;
  if (nestedLoopPattern.test(content)) {
    issues.push('Nested loops detected - consider performance implications for large datasets');
  }

  // Look for synchronous file operations
  const syncFileOps = ['readFileSync', 'writeFileSync', 'statSync'];
  syncFileOps.forEach((op) => {
    if (content.includes(op)) {
      issues.push(
        `Synchronous file operation '${op}' detected - consider using async version for better performance`
      );
    }
  });

  // Look for potential memory leaks
  if (content.includes('setInterval') && !content.includes('clearInterval')) {
    issues.push('setInterval usage detected without clearInterval - potential memory leak');
  }

  // Look for inefficient array operations
  const inefficientPatterns = [
    {
      pattern: /\.forEach\([^)]*\)\s*\.\s*map\(/,
      message: 'forEach followed by map - consider using just map or reduce',
    },
    {
      pattern: /\.filter\([^)]*\)\s*\.\s*filter\(/,
      message: 'Multiple filter operations - consider combining into single filter',
    },
  ];

  inefficientPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      issues.push(message);
    }
  });

  return { passed: issues.length === 0, issues };
}

/**
 * Flag security patterns and concerns
 * @purpose Identify potential security issues
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagSecurityPatterns(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Look for potential security issues
  const securityPatterns = [
    { pattern: /eval\(/, message: 'eval() usage detected - potential security risk' },
    { pattern: /innerHTML\s*=/, message: 'innerHTML assignment detected - potential XSS risk' },
    { pattern: /document\.write\(/, message: 'document.write() detected - potential XSS risk' },
    {
      pattern: /process\.env\.\w+/g,
      message: 'Environment variable access - ensure sensitive data is properly handled',
    },
  ];

  securityPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      issues.push(message);
    }
  });

  // Look for hardcoded secrets or tokens
  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]+['"]/i,
    /token\s*[:=]\s*['"][^'"]+['"]/i,
    /key\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /secret\s*[:=]\s*['"][^'"]+['"]/i,
  ];

  secretPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      issues.push(
        'Potential hardcoded secret detected - ensure sensitive data is properly externalized'
      );
    }
  });

  // Look for SQL injection risks
  if (
    content.includes('query') &&
    content.includes('+') &&
    content.includes('SELECT|INSERT|UPDATE|DELETE')
  ) {
    issues.push('Potential SQL injection risk - ensure parameterized queries are used');
  }

  return { passed: issues.length === 0, issues };
}

module.exports = {
  // Workflows
  executeTier3Audits,

  // Operations
  flagCrossDomainDependencies,
  flagAbstractionOpportunities,
  flagPerformanceConsiderations,
  flagSecurityPatterns,
};
