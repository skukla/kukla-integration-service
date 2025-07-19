/**
 * App Audit - Tier 1 Audits Sub-module
 * High reliability audit rules (90-100% accurate) - Used as CI/CD gate
 */

const fs = require('fs').promises;
const path = require('path');

const format = require('../shared/formatting');

// Tier 1 Audit Workflows

/**
 * Execute Tier 1 audits - High reliability rules for CI/CD gate
 * @purpose Execute high-reliability audits that are 90-100% accurate
 * @param {Array<string>} files - Files to audit
 * @param {Object} results - Results object to populate
 * @returns {Promise<void>} Updates results object with tier 1 audit results
 * @usedBy app-audit.js auditAppWithAllComponents
 */
async function executeTier1Audits(files, results) {
  const tier1Rules = [
    { name: 'import-organization', fn: auditImportOrganization },
    { name: 'export-patterns', fn: auditExportPatterns },
    { name: 'action-framework', fn: auditActionFramework },
    { name: 'naming-conventions', fn: auditNamingConventions },
    { name: 'jsdoc-documentation', fn: auditJSDocDocumentation },
    { name: 'function-organization-within-files', fn: auditFunctionOrganizationWithinFiles },
  ];

  for (const rule of tier1Rules) {
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
            severity: 'error',
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          rule: rule.name,
          file,
          issues: [`Audit error: ${error.message}`],
          severity: 'error',
        });
      }
    }
  }
}

// Tier 1 Audit Operations

/**
 * Audit import organization compliance
 * @purpose Validates import grouping, section comments, and namespace import patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditImportOrganization(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Rule 1: Import organization (grouping is obvious from paths - no section comments needed)
  const importLines = content.match(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);?/g) || [];
  const requireLines = content.match(/const\s+\w+\s*=\s*require\([^)]+\);?/g) || [];

  const totalImports = importLines.length + requireLines.length;

  if (totalImports >= 4) {
    // We don't enforce section comments for imports - grouping is obvious from paths
    // This check is disabled as per our architectural standards
  }

  // Rule 2: No namespace imports (everything is direct imports)
  const namespaceImportPattern = /const\s+\w+\s*=\s*require\(/;
  const requireCount = (content.match(/require\(/g) || []).length;

  if (requireCount > 0) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (namespaceImportPattern.test(line) && line.includes('require(')) {
        // Check if this is an allowed namespace import
        const allowedNamespaceImports = [
          'path',
          'fs',
          'crypto',
          'glob',
          'dotenv', // Node.js built-ins
          './shared/formatting',
          './shared/format',
          './formatting', // Formatting utilities
          'chalk',
          'ora',
          'node-fetch', // Common utility libraries
          '../audit.config.js',
          '../config', // Configuration modules
        ];
        const isAllowed = allowedNamespaceImports.some(
          (allowed) => line.includes(`'${allowed}'`) || line.includes(`"${allowed}"`)
        );

        if (!isAllowed && !line.includes('{')) {
          issues.push(
            `Line ${i + 1}: Use direct imports instead of namespace imports. Import specific functions: ${line.trim()}`
          );
        }
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit export patterns compliance
 * @purpose Validates module.exports structure and grouping
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditExportPatterns(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip files that don't export anything
  if (!content.includes('module.exports')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Must use object-style exports for multiple exports
  const multipleExportPattern = /module\.exports\s*=\s*{\s*[\s\S]*?}/;
  const hasMultipleExports = content.match(multipleExportPattern);

  // Rule 2: No mixed export patterns
  const exportLines = content.split('\n').filter((line) => line.includes('module.exports'));
  if (exportLines.length > 1) {
    issues.push('Multiple module.exports statements found. Use single object export pattern.');
  }

  // Rule 3: Export organization comments (for files with multiple exports)
  if (hasMultipleExports) {
    const exportBlock = hasMultipleExports[0];
    const hasWorkflowComment =
      exportBlock.includes('// Business workflows') || exportBlock.includes('Business workflows');
    const hasOperationComment =
      exportBlock.includes('// Feature operations') || exportBlock.includes('operations');

    // Only flag if exports are complex enough to warrant organization
    const exportCount = (exportBlock.match(/^\s*\w+[,\s]*$/gm) || []).length;
    if (exportCount >= 6 && !hasWorkflowComment && !hasOperationComment) {
      issues.push(
        'Complex exports (6+ functions) should include organization comments (// Business workflows, // Feature operations, etc.)'
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Action Framework compliance
 * @purpose Validates createAction usage and proper action patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditActionFramework(filePath) {
  const issues = [];

  // Only audit action files
  if (!filePath.includes('actions/') || !filePath.endsWith('/index.js')) {
    return { passed: true, issues: [] };
  }

  const content = await fs.readFile(filePath, 'utf8');

  // Rule 1: Must use createAction()
  if (!content.includes('createAction(')) {
    issues.push('Action must use createAction() framework');
  }

  // Rule 2: No legacy main export patterns
  const legacyMainExport = /module\.exports\s*=\s*{\s*main\s*[,}]/;
  const legacyMainExportObject = /module\.exports\s*=\s*{\s*main\s*}/;
  const legacyMainExportDirect = /exports\.main\s*=/;

  if (
    legacyMainExport.test(content) ||
    legacyMainExportObject.test(content) ||
    legacyMainExportDirect.test(content)
  ) {
    issues.push('Action must use createAction() instead of exporting main function');
  }

  // Rule 3: Must have actionName parameter
  if (content.includes('createAction(') && !content.includes('actionName:')) {
    issues.push('createAction() must include actionName parameter');
  }

  // Rule 4: Must have description parameter
  if (content.includes('createAction(') && !content.includes('description:')) {
    issues.push('createAction() must include description parameter');
  }

  // Rule 5: Business logic should be in separate function
  const createActionMatch = content.match(/createAction\(\s*([^,]+)/);
  if (createActionMatch) {
    const businessLogicFunction = createActionMatch[1].trim();
    if (businessLogicFunction.includes('async') || businessLogicFunction.includes('function')) {
      issues.push('Business logic should be in separate function, not inline in createAction()');
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit naming conventions compliance
 * @purpose Validates camelCase functions, kebab-case files, etc.
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditNamingConventions(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Rule 1: File names should be kebab-case
  const fileName = path.basename(filePath, '.js');
  if (fileName !== 'index' && !fileName.match(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)) {
    issues.push(`File name should be kebab-case: ${fileName}`);
  }

  // Rule 2: Function names should be camelCase
  const functionPattern =
    /(?:function\s+|const\s+|let\s+|var\s+)(\w+)(?:\s*=\s*(?:async\s+)?function|\s*=\s*(?:async\s+)?\()/g;
  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    if (!functionName.match(/^[a-z][a-zA-Z0-9]*$/)) {
      issues.push(`Function name should be camelCase: ${functionName}`);
    }
  }

  return { passed: issues.length === 0, issues };
}

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
 * Audit JSDoc documentation compliance
 * @purpose Validate functions have proper JSDoc with required tags
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditJSDocDocumentation(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Check if file is exempt (shared utilities, etc.)
  const exemptFiles = ['shared/', 'config/', 'test'];
  const isExemptFile = exemptFiles.some((pattern) => filePath.includes(pattern));
  if (isExemptFile) {
    return { passed: true, issues: [] };
  }

  // Enhanced function detection
  const functionPatterns = [
    /(async\s+)?function\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>\s*{|\([^)]*\)\s*=>)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/g,
  ];

  let allMatches = [];
  for (const pattern of functionPatterns) {
    // Reset regex state for each pattern
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const functionName = match[2] || match[1];
      // Filter out common false positives and non-function matches
      if (
        functionName &&
        !['module', 'require', 'exports', 'names', 'length', 'const', 'let', 'var'].includes(
          functionName
        ) &&
        functionName.length > 1
      ) {
        allMatches.push({
          name: functionName,
          index: match.index,
        });
      }
    }
  }

  // Check each function for JSDoc with @purpose tag
  for (const func of allMatches) {
    const beforeFunction = content.substring(0, func.index);
    const lines = beforeFunction.split('\n');

    // Check for JSDoc with @purpose tag using helper function
    // Look back up to 20 lines to find JSDoc block (was 10, too narrow)
    const hasProperJSDoc = hasJSDocWithPurpose(lines, lines.length - 20);

    if (!hasProperJSDoc) {
      issues.push(`Function '${func.name}' should have JSDoc documentation with @purpose tag`);
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit function organization within files
 * @purpose Validates progressive disclosure organization patterns
 * @param {string} filePath - Path to file being audited
 * @returns {Promise<Object>} Audit result with passed status and issues
 * @usedBy executeTier1Audits
 */
async function auditFunctionOrganizationWithinFiles(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip small files and infrastructure
  const functionCount = (
    content.match(/(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(/g) || []
  ).length;
  if (functionCount < 3 || filePath.includes('/shared/') || filePath.includes('config/')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Feature files should have progressive disclosure organization
  const hasWorkflowSection =
    content.includes('// Business Workflows') || content.includes('=== BUSINESS WORKFLOWS ===');
  const hasOperationSection =
    content.includes('// Feature Operations') || content.includes('=== FEATURE OPERATIONS ===');
  const hasUtilitySection =
    content.includes('// Feature Utilities') || content.includes('=== FEATURE UTILITIES ===');

  if (!hasWorkflowSection && !hasOperationSection && !hasUtilitySection) {
    issues.push(
      'Feature files with 3+ functions should use progressive disclosure organization (// Business Workflows → // Feature Operations → // Feature Utilities)'
    );
  }

  // Rule 2: Check for outdated "shouty" section headers
  if (
    content.includes('=== BUSINESS WORKFLOWS ===') ||
    content.includes('=== FEATURE OPERATIONS ===') ||
    content.includes('=== FEATURE UTILITIES ===')
  ) {
    issues.push(
      'Use simple section headers (// Business Workflows) instead of "shouty" triple-equals format (=== BUSINESS WORKFLOWS ===)'
    );
  }

  // Rule 3: Check for redundant export headers
  if (
    content.includes('=== EXPORTS ORGANIZATION ===') ||
    content.includes('// === EXPORTS ORGANIZATION ===')
  ) {
    issues.push(
      'Remove redundant export headers - module.exports = { } is clear enough without additional headers'
    );
  }

  return { passed: issues.length === 0, issues };
}

module.exports = {
  // Workflows
  executeTier1Audits,

  // Operations
  auditImportOrganization,
  auditExportPatterns,
  auditActionFramework,
  auditNamingConventions,
  auditJSDocDocumentation,
  auditFunctionOrganizationWithinFiles,
};
