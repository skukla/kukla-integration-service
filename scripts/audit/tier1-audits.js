/**
 * App Audit - Tier 1 Audits Feature Core
 * High reliability audit rules (90-100% accurate) - Used as CI/CD gate
 */

const fs = require('fs').promises;
const path = require('path');

// Import audit operations from sub-modules
const { loadAuditConfig, getFlattenedPatterns } = require('./config-loader');
const { auditExportPatterns } = require('./tier1-audits/export-patterns');
const { auditImportOrganization } = require('./tier1-audits/import-organization');
const { auditJSDocDocumentation } = require('./tier1-audits/jsdoc-documentation');
const { subInfo } = require('../shared/formatting');

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

// Tier 1 Audit Operations (kept in core for simpler rules)

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
 * Check for progressive disclosure section headers using external config
 * @purpose Validate presence of section organization headers in content
 * @param {string} content - File content to check
 * @returns {Promise<Object>} Object with boolean flags for each section type
 */
async function checkSectionHeaders(content) {
  // Load section headers configuration
  const sectionConfig = await loadAuditConfig('sectionHeaders');

  // Get patterns from external config
  const workflowPatterns = getFlattenedPatterns(sectionConfig, 'workflowPatterns.patterns');
  const operationPatterns = getFlattenedPatterns(sectionConfig, 'operationPatterns.patterns');
  const utilityPatterns = getFlattenedPatterns(sectionConfig, 'utilityPatterns.patterns');
  const legacyPatterns = getFlattenedPatterns(sectionConfig, 'legacyPatterns.patterns');

  const hasWorkflowSection = workflowPatterns.some((pattern) => content.includes(pattern));
  const hasOperationSection = operationPatterns.some((pattern) => content.includes(pattern));
  const hasUtilitySection = utilityPatterns.some((pattern) => content.includes(pattern));
  const hasShoutySections = legacyPatterns.some((pattern) => content.includes(pattern));
  const hasRedundantExportHeaders = legacyPatterns
    .slice(-2)
    .some((pattern) => content.includes(pattern));

  return {
    hasWorkflowSection,
    hasOperationSection,
    hasUtilitySection,
    hasShoutySections,
    hasRedundantExportHeaders,
  };
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
  if (
    functionCount < 3 ||
    filePath.includes('/shared/') ||
    filePath.includes('config/') ||
    filePath.includes('audit/')
  ) {
    return { passed: true, issues: [] };
  }

  const sections = await checkSectionHeaders(content);

  // Rule 1: Feature files should have progressive disclosure organization
  if (
    !sections.hasWorkflowSection &&
    !sections.hasOperationSection &&
    !sections.hasUtilitySection
  ) {
    issues.push(
      'Feature files with 3+ functions should use progressive disclosure organization with descriptive section headers (e.g., "// Business Workflows", "// Query Building Workflows", "// Feature Operations", "// Feature Utilities")'
    );
  }

  // Rule 2: Check for outdated "shouty" section headers
  if (sections.hasShoutySections) {
    issues.push(
      'Use simple section headers (// Business Workflows) instead of "shouty" triple-equals format (=== BUSINESS WORKFLOWS ===)'
    );
  }

  // Rule 3: Check for redundant export headers
  if (sections.hasRedundantExportHeaders) {
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
