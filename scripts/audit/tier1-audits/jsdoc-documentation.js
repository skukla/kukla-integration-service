/**
 * Tier 1 Audits - JSDoc Documentation Sub-module
 * Function JSDoc validation with @purpose tag requirements
 */

const fs = require('fs').promises;

const {
  loadAuditConfig,
  getFlattenedPatterns,
  getAllJSDocExclusions,
} = require('../config-loader');

/**
 * Check if JSDoc block contains @purpose tag
 * @purpose Validate JSDoc content for required @purpose tag
 * @param {string[]} lines - Lines before function
 * @param {number} startIndex - Starting line index
 * @returns {boolean} True if proper JSDoc with @purpose found
 */
function hasJSDocWithPurpose(lines, startIndex) {
  let lastJSDocContent = '';
  let inJSDocBlock = false;
  let jsdocContent = '';

  for (let i = Math.max(0, startIndex); i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('/**')) {
      inJSDocBlock = true;
      jsdocContent = line;
    } else if (inJSDocBlock) {
      jsdocContent += ' ' + line;

      if (line.includes('*/')) {
        // Found complete JSDoc block - save it and continue looking
        lastJSDocContent = jsdocContent;
        inJSDocBlock = false;
        jsdocContent = '';
      }
    }
  }

  // Check the last (closest to function) JSDoc block found
  return lastJSDocContent.includes('@purpose');
}

/**
 * Detect functions in content using pattern matching
 * @purpose Extract function definitions from file content
 * @param {string} content - File content to analyze
 * @param {Array} excludedNames - Array of excluded names from config
 * @returns {Array} Array of function matches with names and positions
 */
function detectFunctionsInContent(content, excludedNames) {
  const functionPatterns = [
    /(async\s+)?function\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>\s*{|\([^)]*\)\s*=>)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/g,
  ];

  let allMatches = [];
  for (const pattern of functionPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const functionName = match[2] || match[1];

      // Get the line to check if it's a variable assignment expression
      const beforeMatch = content.substring(0, match.index);
      const lineStart = beforeMatch.lastIndexOf('\n') + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const fullLine = content.substring(lineStart, lineEnd);

      // Skip variable assignments that are expressions (not function definitions)
      const isVariableExpression =
        /const\s+\w+\s*=\s*[^(]*\.[^(]*\(/.test(fullLine) ||
        /const\s+\w+\s*=\s*[^=]*\+/.test(fullLine) ||
        /const\s+\w+\s*=\s*[^=]*\.length/.test(fullLine);

      if (isVariableExpression) {
        continue;
      }

      if (shouldIncludeFunction(functionName, excludedNames)) {
        allMatches.push({
          name: functionName,
          index: match.index,
        });
      }
    }
  }
  return allMatches;
}

/**
 * Check if function name should be included in JSDoc audit
 * @purpose Filter out variable names and language keywords from function detection
 * @param {string} functionName - Function name to check
 * @param {Array} excludedNames - Array of excluded names from config
 * @returns {boolean} True if function should be included
 */
function shouldIncludeFunction(functionName, excludedNames) {
  return (
    functionName &&
    !excludedNames.includes(functionName) &&
    functionName.length > 1 &&
    /^[a-zA-Z_]/.test(functionName) &&
    !/^[A-Z_]+$/.test(functionName)
  );
}

/**
 * Audit JSDoc documentation compliance
 * @purpose Validate functions have proper JSDoc with required tags
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditJSDocDocumentation(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Load JSDoc exclusions configuration
  const jsdocConfig = await loadAuditConfig('jsdocExclusions');
  const exemptDirectories = getFlattenedPatterns(jsdocConfig, 'exemptDirectories.patterns');
  const excludedNames = getAllJSDocExclusions(jsdocConfig);

  // Check if file is exempt
  const isExemptFile = exemptDirectories.some((pattern) => filePath.includes(pattern));
  if (isExemptFile) {
    return { passed: true, issues: [] };
  }

  // Detect functions in content
  const allMatches = detectFunctionsInContent(content, excludedNames);

  // Check each function for JSDoc with @purpose tag
  for (const func of allMatches) {
    const beforeFunction = content.substring(0, func.index);
    const lines = beforeFunction.split('\n');

    const searchRange = jsdocConfig.jsdocSearchRange.value;
    const hasProperJSDoc = hasJSDocWithPurpose(lines, lines.length - searchRange);

    if (!hasProperJSDoc) {
      issues.push(`Function '${func.name}' should have JSDoc documentation with @purpose tag`);
    }
  }

  return { passed: issues.length === 0, issues };
}

module.exports = {
  auditJSDocDocumentation,
};
