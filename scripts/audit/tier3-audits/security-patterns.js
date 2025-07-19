/**
 * Tier 3 Audits - Security Patterns Sub-module
 * All security analysis and vulnerability detection utilities
 */

const fs = require('fs');

// Security Analysis Workflows

/**
 * Flag security patterns for manual review
 * @purpose Check for potential security issues while excluding legitimate config patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier3Audits
 */
async function flagSecurityPatterns(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const issues = [];

  // Analyze file context for appropriate security rules
  const fileContext = analyzeFileContext(filePath);

  // Look for potential security issues (excluding legitimate patterns)
  const securityIssues = analyzeSecurityPatterns(content, fileContext);
  issues.push(...securityIssues);

  // Look for hardcoded secrets (excluding config defaults and test data)
  if (!fileContext.isConfigFile && !filePath.includes('test')) {
    const secretIssues = analyzeHardcodedSecrets(content);
    issues.push(...secretIssues);
  }

  return { passed: issues.length === 0, issues };
}

// Security Analysis Utilities

/**
 * Analyze file context to determine appropriate security rules
 * @purpose Categorize files to apply appropriate security analysis
 * @param {string} filePath - Path to file being analyzed
 * @returns {Object} File context analysis result
 */
function analyzeFileContext(filePath) {
  return {
    isConfigFile: filePath.includes('config/') || filePath.includes('domains/'),
    isAuditScript: filePath.includes('scripts/audit/') || filePath.includes('audit-test'),
    isScriptFile: filePath.includes('scripts/'),
  };
}

/**
 * Analyze security patterns in content
 * @purpose Detect potential security issues while excluding legitimate patterns
 * @param {string} content - File content to analyze
 * @param {Object} fileContext - File context information
 * @returns {Array} Array of issues found
 */
function analyzeSecurityPatterns(content, fileContext) {
  const issues = [];
  const securityPatterns = getSecurityPatterns(fileContext);

  securityPatterns.forEach(({ pattern, message, skipFor }) => {
    if (!skipFor && pattern.test(content)) {
      issues.push(message);
    }
  });

  return issues;
}

/**
 * Get security patterns to check based on file context
 * @purpose Define security patterns with context-aware exclusions
 * @param {Object} fileContext - File context information
 * @returns {Array} Array of security pattern objects
 */
function getSecurityPatterns(fileContext) {
  return [
    {
      pattern: /eval\(/,
      message: 'eval() usage detected - potential security risk',
      skipFor: fileContext.isAuditScript, // Audit scripts legitimately use eval for pattern detection
    },
    {
      pattern: /innerHTML\s*=/,
      message: 'innerHTML assignment detected - potential XSS risk',
      skipFor: false,
    },
    {
      pattern: /document\.write\(/,
      message: 'document.write() detected - potential XSS risk',
      skipFor: fileContext.isAuditScript, // Audit scripts may reference this pattern
    },
    {
      pattern: /process\.env\.\w+/g,
      message: 'Environment variable access - ensure sensitive data is properly handled',
      skipFor: fileContext.isConfigFile || fileContext.isScriptFile, // Config and scripts legitimately access env vars
    },
  ];
}

/**
 * Analyze hardcoded secrets in content
 * @purpose Detect potential hardcoded credentials while excluding obvious examples and config references
 * @param {string} content - File content to analyze
 * @returns {Array} Array of issues found
 */
function analyzeHardcodedSecrets(content) {
  const issues = [];
  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]{8,}['"]/i, // Only flag longer passwords
    /token\s*[:=]\s*['"][^'"]{32,}['"]/i, // Only flag actual tokens
    /key\s*[:=]\s*['"][^'"]{20,}['"]/i, // Only flag longer keys
    /secret\s*[:=]\s*['"][^'"]{16,}['"]/i, // Only flag longer secrets
  ];

  secretPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      const matches = content.match(pattern);
      if (matches) {
        const hasRealSecrets = matches.some((match) => {
          // Exclude configuration references
          if (isConfigurationReference(match)) {
            return false;
          }

          // Exclude obvious examples and placeholders
          return !isExampleSecret(match);
        });

        if (hasRealSecrets) {
          issues.push(
            'Potential hardcoded secret detected - ensure sensitive data is properly externalized'
          );
        }
      }
    }
  });

  return issues;
}

/**
 * Check if a secret pattern is actually a configuration reference
 * @purpose Filter out legitimate configuration access patterns
 * @param {string} match - Matched secret pattern
 * @returns {boolean} True if this is a configuration reference
 */
function isConfigurationReference(match) {
  const configPatterns = [
    'config.',
    'process.env.',
    'params.',
    'options.',
    'settings.',
    'env.',
    '${', // Template variables
    '$(', // Environment substitution
  ];

  return configPatterns.some((pattern) => match.includes(pattern));
}

/**
 * Check if a matched secret is an example or placeholder
 * @purpose Filter out obvious example values from secret detection
 * @param {string} match - Matched secret pattern
 * @returns {boolean} True if this appears to be an example
 */
function isExampleSecret(match) {
  const examplePatterns = [
    'example',
    'placeholder',
    'default',
    'xxx',
    '***',
    'test',
    'demo',
    'sample',
  ];

  return examplePatterns.some((pattern) => match.toLowerCase().includes(pattern));
}

module.exports = {
  flagSecurityPatterns,
};
