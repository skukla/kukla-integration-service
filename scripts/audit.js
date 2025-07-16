#!/usr/bin/env node

/**
 * Architecture Standards Audit Script
 *
 * Comprehensive auditing system for Feature-First DDD + Domain standards
 * Validates compliance with ARCHITECTURE-STANDARDS.md across the entire codebase
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const fs = require('fs').promises;
const path = require('path');

const { glob } = require('glob');

// === AUDIT CORE ENGINE ===

/**
 * Main audit orchestration workflow
 * Executes all audit rules and generates comprehensive report
 */
async function runArchitectureAudit(options = {}) {
  console.log('🔍 Architecture Standards Audit\n');

  const startTime = Date.now();
  const auditResults = {
    tier1: { passed: 0, failed: 0, details: [] },
    tier2: { passed: 0, failed: 0, details: [] },
    tier3: { passed: 0, failed: 0, details: [] },
    summary: { totalFiles: 0, totalRules: 0 },
  };

  try {
    // Step 1: Discover all relevant files
    const files = await discoverAuditableFiles();
    auditResults.summary.totalFiles = files.length;

    console.log(`📁 Analyzing ${files.length} files...\n`);

    // Step 2: Execute Tier 1 audits (High Reliability)
    console.log('⚡ Tier 1: High Reliability Rules (90-100% accurate)');
    await executeTier1Audits(files, auditResults.tier1);

    // Step 3: Execute Tier 2 audits (Pattern Detection)
    console.log('\n🎯 Tier 2: Pattern Detection Rules (70-90% accurate)');
    await executeTier2Audits(files, auditResults.tier2);

    // Step 4: Execute Tier 3 audits (Manual Review Flags)
    console.log('\n🚨 Tier 3: Manual Review Flags (guidance only)');
    await executeTier3Audits(files, auditResults.tier3);

    // Step 5: Generate comprehensive report
    const duration = Date.now() - startTime;
    generateAuditReport(auditResults, duration, options);

    // Step 6: Exit with appropriate code
    const hasFailures = auditResults.tier1.failed > 0 || auditResults.tier2.failed > 0;
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error('💥 Audit execution failed:', error.message);
    process.exit(1);
  }
}

/**
 * Discover all files that should be audited
 * Focuses on src/, actions/, scripts/, and config/ directories
 */
async function discoverAuditableFiles() {
  const patterns = [
    'src/**/*.js',
    'actions/**/*.js',
    'scripts/**/*.js',
    'config/**/*.js',
    'tools/**/*.js',
  ];

  const excludePatterns = [
    'node_modules/**',
    'dist/**',
    '.parcel-cache/**',
    'web-src/**', // Frontend has different standards
    '**/*.test.js',
    '**/*.spec.js',
  ];

  let allFiles = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: excludePatterns });
    allFiles = allFiles.concat(files);
  }

  // Remove duplicates and sort
  return [...new Set(allFiles)].sort();
}

// === TIER 1: HIGH RELIABILITY AUDITS ===

/**
 * Execute Tier 1 audits - High reliability programmatic checks
 * These should be 90-100% accurate and safe for CI/CD gates
 */
async function executeTier1Audits(files, results) {
  const tier1Rules = [
    { name: 'file-structure-compliance', fn: auditFileStructure },
    { name: 'import-organization', fn: auditImportOrganization },
    { name: 'export-patterns', fn: auditExportPatterns },
    { name: 'action-framework-compliance', fn: auditActionFramework },
    { name: 'naming-conventions', fn: auditNamingConventions },
    { name: 'jsdoc-documentation', fn: auditJSDocDocumentation },
    { name: 'step-comments', fn: auditStepComments },
    { name: 'file-header-comments', fn: auditFileHeaders },
  ];

  results.totalRules = tier1Rules.length;

  for (const rule of tier1Rules) {
    console.log(`  ├─ ${rule.name}`);

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
          issues: [`Audit execution error: ${error.message}`],
          severity: 'error',
        });
      }
    }
  }
}

/**
 * Audit file structure compliance with Feature-First DDD
 * Validates domain organization and directory patterns
 */
async function auditFileStructure(filePath) {
  const issues = [];

  // Rule 1: Source files must be in proper domain directories
  if (filePath.startsWith('src/')) {
    const pathParts = filePath.split('/');

    // Should be src/domain/feature.js or src/shared/...
    if (pathParts.length < 3) {
      issues.push('Files in src/ must be in domain directories (src/domain/feature.js)');
    }

    // Check for proper domain naming
    const domain = pathParts[1];
    const validDomains = ['products', 'files', 'commerce', 'htmx', 'shared'];
    const validSharedSubdirs = ['action', 'errors', 'http', 'routing', 'validation', 'utils'];

    if (domain === 'shared') {
      if (pathParts.length >= 3 && !validSharedSubdirs.includes(pathParts[2])) {
        issues.push(
          `Invalid shared subdirectory: ${pathParts[2]}. Must be one of: ${validSharedSubdirs.join(', ')}`
        );
      }
    } else if (!validDomains.includes(domain)) {
      issues.push(
        `Invalid domain directory: ${domain}. Must be one of: ${validDomains.join(', ')}`
      );
    }
  }

  // Rule 2: Actions must use clean orchestrator pattern
  if (filePath.startsWith('actions/') && filePath.endsWith('/index.js')) {
    const content = await fs.readFile(filePath, 'utf8');

    if (!content.includes('createAction(')) {
      issues.push('Action must use createAction() framework pattern');
    }

    if (content.includes('module.exports = { main }')) {
      issues.push('Action must use createAction() instead of manual main export');
    }
  }

  // Rule 3: Scripts must follow operational domain boundaries
  if (filePath.startsWith('scripts/')) {
    const pathParts = filePath.split('/');
    if (pathParts.length >= 2) {
      const scriptDomain = pathParts[1];
      const validScriptDomains = [
        'deployment',
        'testing',
        'monitoring',
        'development',
        'core',
        'shared',
      ];

      if (!validScriptDomains.includes(scriptDomain)) {
        issues.push(
          `Invalid script domain: ${scriptDomain}. Must be one of: ${validScriptDomains.join(', ')}`
        );
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit import organization compliance
 * Validates three-tier import pattern and top-of-file placement
 */
async function auditImportOrganization(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  // Skip empty files or files with only comments
  const codeLines = lines.filter(
    (line) => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('*')
  );
  if (codeLines.length === 0) {
    return { passed: true, issues: [] };
  }

  // Rule 1: All requires must be at top of file (before any other code)
  let firstRequireLine = -1;
  let lastRequireLine = -1;
  let firstNonImportCodeLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
      continue;
    }

    if (line.includes('require(') && !line.startsWith('//')) {
      if (firstRequireLine === -1) firstRequireLine = i;
      lastRequireLine = i;
    } else if (line && !line.startsWith('/**') && firstNonImportCodeLine === -1) {
      firstNonImportCodeLine = i;
    }
  }

  // Check for inline requires (after other code)
  if (
    firstRequireLine > -1 &&
    firstNonImportCodeLine > -1 &&
    firstRequireLine > firstNonImportCodeLine
  ) {
    issues.push('All require() statements must be at the top of the file before any other code');
  }

  // Rule 2: Check for three-tier import organization comments
  const hasInfrastructureSection = content.includes('=== INFRASTRUCTURE DEPENDENCIES ===');
  const hasDomainSection = content.includes('=== DOMAIN DEPENDENCIES ===');
  const hasCrossDomainSection = content.includes('=== CROSS-DOMAIN DEPENDENCIES ===');

  if (firstRequireLine > -1) {
    // Only check if file has imports
    if (!hasInfrastructureSection && !hasDomainSection && !hasCrossDomainSection) {
      issues.push(
        'Missing import organization sections. Must include at least one of: INFRASTRUCTURE, DOMAIN, or CROSS-DOMAIN DEPENDENCIES'
      );
    }
  }

  // Rule 3: No namespace imports (const utils = require('utils'))
  const namespaceImportPattern = /const\s+\w+\s*=\s*require\(['"][^'"]*['"]\)\s*(?:\/\/.*)?$/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (namespaceImportPattern.test(line) && !line.includes('{')) {
      // Allow some exceptions like const fs = require('fs')
      const allowedNamespaceImports = ['fs', 'path', 'glob', 'util'];
      const hasAllowedException = allowedNamespaceImports.some(
        (allowed) => line.includes(`'${allowed}'`) || line.includes(`"${allowed}"`)
      );

      if (!hasAllowedException) {
        issues.push(
          `Line ${i + 1}: Prefer destructured imports over namespace imports: ${line.trim()}`
        );
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit export patterns compliance
 * Validates module.exports structure and grouping
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
  const singleExportPattern = /module\.exports\s*=\s*[^{]/;

  const hasMultipleExports = content.match(multipleExportPattern);
  const hasSingleExport = content.match(singleExportPattern);

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
    const exportCount = (exportBlock.match(/\w+,/g) || []).length + 1;
    if (exportCount >= 3 && !hasWorkflowComment && !hasOperationComment) {
      issues.push(
        'Complex exports should include organization comments (// Business workflows, // Feature operations, etc.)'
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Action Framework compliance
 * Validates createAction usage and proper action patterns
 */
async function auditActionFramework(filePath) {
  const issues = [];

  // Only audit action files
  if (!filePath.startsWith('actions/') || !filePath.endsWith('/index.js')) {
    return { passed: true, issues: [] };
  }

  const content = await fs.readFile(filePath, 'utf8');

  // Rule 1: Must use createAction()
  if (!content.includes('createAction(')) {
    issues.push('Action must use createAction() framework');
  }

  // Rule 2: Must not export main function directly
  if (content.includes('module.exports = { main }') || content.includes('exports.main =')) {
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
 * Validates camelCase functions, kebab-case files, etc.
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

  // Rule 3: Constants should be UPPER_CASE (optional but recommended)
  const constantPattern = /const\s+([A-Z_][A-Z0-9_]*)\s*=/g;
  while ((match = constantPattern.exec(content)) !== null) {
    const constantName = match[1];
    if (!constantName.match(/^[A-Z][A-Z0-9_]*$/)) {
      // This is a warning, not an error
      issues.push(`Constant should be UPPER_CASE: ${constantName} (warning)`);
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit JSDoc documentation presence and quality
 * Validates function documentation and "Used by:" comments
 */
async function auditJSDocDocumentation(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Find all function declarations
  const functionPattern =
    /(?:\/\*\*[\s\S]*?\*\/\s*)?(async\s+)?function\s+(\w+)|(?:\/\*\*[\s\S]*?\*\/\s*)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/g;
  let match;

  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[2] || match[3];

    // Skip certain utility functions that don't need documentation
    if (['module', 'require', 'exports'].includes(functionName)) {
      continue;
    }

    // Check if function has JSDoc comment immediately before it
    const functionStart = match.index;
    const beforeFunction = content.substring(0, functionStart);
    const hasJSDoc = beforeFunction.trim().endsWith('*/');

    if (!hasJSDoc) {
      issues.push(`Function '${functionName}' missing JSDoc documentation`);
    } else {
      // Check for "Used by:" comment in JSDoc
      const jsdocStart = beforeFunction.lastIndexOf('/**');
      if (jsdocStart > -1) {
        const jsdocBlock = content.substring(jsdocStart, functionStart);

        // Workflow functions should have "Used by:" comments
        const isWorkflowFunction =
          jsdocBlock.includes('workflow') ||
          jsdocBlock.includes('Used by:') ||
          functionName.includes('workflow') ||
          functionName.includes('process') ||
          functionName.includes('handle');

        if (isWorkflowFunction && !jsdocBlock.includes('Used by:')) {
          issues.push(`Workflow function '${functionName}' should include "Used by:" in JSDoc`);
        }
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit step comments in workflow functions
 * Validates "Step N:" comment patterns
 */
async function auditStepComments(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Find workflow functions (functions with multiple async operations)
  const workflowPattern = /(?:async\s+)?function\s+(\w+)[^{]*{([^}]+(?:{[^}]*}[^}]*)*)/g;
  let match;

  while ((match = workflowPattern.exec(content)) !== null) {
    const functionName = match[1];
    const functionBody = match[2];

    // Count async calls in function
    const asyncCalls = (functionBody.match(/await\s+/g) || []).length;

    // Workflow functions should have step comments if they have multiple async calls
    if (asyncCalls >= 2) {
      const hasStepComments = /\/\/\s*Step\s+\d+:/i.test(functionBody);

      if (!hasStepComments) {
        issues.push(
          `Workflow function '${functionName}' with ${asyncCalls} async calls should include "Step N:" comments`
        );
      } else {
        // Validate step numbering
        const stepMatches = functionBody.match(/\/\/\s*Step\s+(\d+):/gi) || [];
        const stepNumbers = stepMatches.map((step) => parseInt(step.match(/\d+/)[0]));

        // Check for sequential numbering
        for (let i = 0; i < stepNumbers.length; i++) {
          if (stepNumbers[i] !== i + 1) {
            issues.push(
              `Function '${functionName}' has non-sequential step numbering: found Step ${stepNumbers[i]}, expected Step ${i + 1}`
            );
            break;
          }
        }
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit file header comments
 * Validates file description and purpose documentation
 */
async function auditFileHeaders(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip very small files
  if (content.split('\n').length < 10) {
    return { passed: true, issues: [] };
  }

  // Rule 1: File should start with descriptive comment
  const lines = content.split('\n');
  let hasHeaderComment = false;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (
      line.startsWith('/**') ||
      line.startsWith('/*') ||
      (line.startsWith('*') &&
        (line.includes('domain') ||
          line.includes('Domain') ||
          line.includes('feature') ||
          line.includes('Feature') ||
          line.includes('Complete')))
    ) {
      hasHeaderComment = true;
      break;
    }
  }

  if (!hasHeaderComment) {
    // Only flag significant files
    const lineCount = lines.length;
    if (lineCount > 50) {
      issues.push('Large files should include descriptive header comment explaining purpose');
    }
  }

  return { passed: issues.length === 0, issues };
}

// === TIER 2: PATTERN DETECTION AUDITS ===

/**
 * Execute Tier 2 audits - Pattern detection with moderate reliability
 * These are 70-90% accurate and good for warnings
 */
async function executeTier2Audits(files, results) {
  const tier2Rules = [
    { name: 'function-length-guidelines', fn: auditFunctionLength },
    { name: 'file-size-limits', fn: auditFileSize },
    { name: 'configuration-access-patterns', fn: auditConfigurationPatterns },
    { name: 'feature-configuration-boundaries', fn: auditFeatureConfigurationBoundaries },
    { name: 'operation-configuration-usage', fn: auditOperationConfigurationUsage },
    { name: 'configuration-documentation', fn: auditConfigurationDocumentation },
    { name: 'error-handling-patterns', fn: auditErrorHandling },
    { name: 'feature-first-organization', fn: auditFeatureFirstOrganization },
  ];

  for (const rule of tier2Rules) {
    console.log(`  ├─ ${rule.name}`);

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

/**
 * Audit function length guidelines
 * Target: 10-40 lines, acceptable: up to 60 lines
 */
async function auditFunctionLength(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Find function definitions and measure their length
  const functionPattern = /(?:async\s+)?function\s+(\w+)[^{]*{/g;
  let match;

  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    const functionStart = match.index;

    // Find function end by counting braces
    let braceCount = 1;
    let pos = functionStart + match[0].length;

    while (pos < content.length && braceCount > 0) {
      if (content[pos] === '{') braceCount++;
      if (content[pos] === '}') braceCount--;
      pos++;
    }

    const functionContent = content.substring(functionStart, pos);
    const lineCount = functionContent.split('\n').length;

    if (lineCount > 60) {
      issues.push(`Function '${functionName}' is ${lineCount} lines (max recommended: 60)`);
    } else if (lineCount > 40) {
      issues.push(
        `Function '${functionName}' is ${lineCount} lines (target: 10-40, consider splitting)`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit file size limits
 * Target: 150-400 lines, max: 600 lines
 */
async function auditFileSize(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  const lineCount = lines.length;

  if (lineCount > 600) {
    issues.push(`File is ${lineCount} lines (max: 600) - mandatory split required`);
  } else if (lineCount > 400) {
    issues.push(`File is ${lineCount} lines (target: 150-400) - consider splitting features`);
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit configuration access patterns
 * No optional chaining with fallbacks (config?.foo?.bar || default)
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

  // Rule 2: Check for proper loadConfig usage
  if (
    content.includes('params') &&
    content.includes('config') &&
    !content.includes('loadConfig(')
  ) {
    // Only flag if it looks like a business logic file that should use loadConfig
    if (filePath.startsWith('src/') && !filePath.includes('/shared/')) {
      issues.push('Business logic should use loadConfig(params) for configuration');
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Feature Configuration Boundaries
 * Features should receive config as parameter, extract needed sections, never load config
 */
async function auditFeatureConfigurationBoundaries(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Only audit feature files (not shared infrastructure)
  if (filePath.includes('/shared/') || filePath.startsWith('config/')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Features should not load configuration themselves
  if (content.includes('loadConfig(') && filePath.startsWith('src/')) {
    // Allow only in action initialization, not in feature workflows
    if (!filePath.includes('action') && !filePath.includes('initialization')) {
      issues.push('Features should receive config as parameter, not load it themselves');
    }
  }

  // Rule 2: Features should not modify configuration
  const configModificationPattern = /config\.\w+\s*=|config\[\w+\]\s*=/g;
  if (configModificationPattern.test(content)) {
    issues.push('Features should never modify configuration objects');
  }

  // Rule 3: Check for proper config parameter usage in workflow functions
  const workflowPattern = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
  let match;

  while ((match = workflowPattern.exec(content)) !== null) {
    const functionName = match[1];
    const functionSignature = match[0];

    // Skip utility functions and imports
    if (functionName.startsWith('require') || functionName.length < 4) {
      continue;
    }

    // Main workflow functions should have config parameter
    if (
      (functionName.includes('export') ||
        functionName.includes('fetch') ||
        functionName.includes('process')) &&
      !functionSignature.includes('config')
    ) {
      issues.push(`Workflow function '${functionName}' should receive config as parameter`);
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Operation Configuration Usage
 * Operations should receive targeted config sections, not access global config
 */
async function auditOperationConfigurationUsage(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Only audit operation files
  if (!filePath.includes('operations/') && !filePath.includes('operation')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Operations should not perform environment detection
  const envDetectionPattern = /process\.env\.NODE_ENV|process\.env\.\w+/g;

  if (envDetectionPattern.test(content)) {
    // Allow in config builders only
    if (!filePath.startsWith('config/')) {
      issues.push('Operations should not perform environment detection - use config system');
    }
  }

  // Rule 2: Operations should use targeted config sections
  const globalConfigPattern = /config\.[a-z]+\.[a-z]+\.[a-z]+/g;
  const globalMatches = content.match(globalConfigPattern) || [];

  if (globalMatches.length > 3) {
    issues.push(
      'Operation accesses many config sections - consider extracting specific sections in calling function'
    );
  }

  // Rule 3: No direct configuration loading in operations
  if (content.includes('loadConfig(') && filePath.includes('operations/')) {
    issues.push(
      'Operations should receive configuration from calling workflow, not load it directly'
    );
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Configuration Documentation
 * Features should document their configuration requirements
 */
async function auditConfigurationDocumentation(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Only audit main feature workflow files
  if (
    filePath.includes('/shared/') ||
    filePath.startsWith('config/') ||
    !filePath.startsWith('src/')
  ) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Main workflow functions should document config requirements
  const workflowJSDocPattern = /\/\*\*[\s\S]*?\*\/\s*(?:async\s+)?function\s+(\w+)/g;
  let match;

  while ((match = workflowJSDocPattern.exec(content)) !== null) {
    const functionName = match[1];
    const jsdocBlock = match[0];

    // Check if it's a main workflow function
    if (
      functionName.includes('export') ||
      functionName.includes('fetch') ||
      functionName.includes('process') ||
      jsdocBlock.includes('Used by:')
    ) {
      // Should document configuration requirements
      if (!jsdocBlock.includes('Configuration Requirements:') && !jsdocBlock.includes('config.')) {
        issues.push(
          `Workflow function '${functionName}' should document configuration requirements in JSDoc`
        );
      }
    }
  }

  // Rule 2: Files using multiple config sections should document them
  const configUsagePattern = /config\.(\w+)/g;
  const configSections = new Set();

  while ((match = configUsagePattern.exec(content)) !== null) {
    configSections.add(match[1]);
  }

  if (configSections.size >= 2) {
    // Check if file has any configuration documentation
    if (
      !content.includes('Configuration Requirements:') &&
      !content.includes('config.') &&
      !content.includes('@param {Object} config')
    ) {
      issues.push(
        `File uses ${configSections.size} config sections but lacks configuration documentation`
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit error handling patterns
 * Three-tier error handling and proper error types
 */
async function auditErrorHandling(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Rule 1: Catch blocks should use proper error handling
  const catchPattern = /catch\s*\([^)]*\)\s*{([^}]+(?:{[^}]*}[^}]*)*)/g;
  let match;

  while ((match = catchPattern.exec(content)) !== null) {
    const catchBody = match[1];

    // Check for proper error creation
    if (
      !catchBody.includes('createError') &&
      !catchBody.includes('response.error') &&
      !catchBody.includes('throw') &&
      catchBody.includes('console.')
    ) {
      issues.push(
        'Catch blocks should use createError() or response.error() instead of just console logging'
      );
    }
  }

  // Rule 2: Check for error type imports
  if (content.includes('createError') && !content.includes('ErrorType')) {
    issues.push('Files using createError should import ErrorType for consistency');
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Audit Feature-First organization within files
 * Composite → atomic ordering (workflows → operations → utilities)
 */
async function auditFeatureFirstOrganization(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Skip shared infrastructure files
  if (filePath.includes('/shared/')) {
    return { passed: true, issues: [] };
  }

  // Rule 1: Check for section organization comments
  const hasWorkflowSection = content.includes('=== BUSINESS WORKFLOWS ===');
  const hasOperationSection = content.includes('=== FEATURE OPERATIONS ===');
  const hasUtilitySection = content.includes('=== FEATURE UTILITIES ===');

  // Only check files with multiple functions
  const functionCount = (content.match(/function\s+\w+/g) || []).length;

  if (functionCount >= 3) {
    if (!hasWorkflowSection && !hasOperationSection && !hasUtilitySection) {
      issues.push(
        'Complex feature files should include organization sections (BUSINESS WORKFLOWS, FEATURE OPERATIONS, FEATURE UTILITIES)'
      );
    }
  }

  return { passed: issues.length === 0, issues };
}

// === TIER 3: MANUAL REVIEW FLAGS ===

/**
 * Execute Tier 3 audits - Manual review flags and guidance
 * These identify potential issues that require human judgment
 */
async function executeTier3Audits(files, results) {
  const tier3Rules = [
    { name: 'complex-business-logic', fn: flagComplexBusinessLogic },
    { name: 'potential-cognitive-load', fn: flagCognitiveLoad },
    { name: 'cross-domain-dependencies', fn: flagCrossDomainDependencies },
    { name: 'potential-abstraction-opportunities', fn: flagAbstractionOpportunities },
  ];

  for (const rule of tier3Rules) {
    console.log(`  ├─ ${rule.name}`);

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
          issues: [`Review flag error: ${error.message}`],
          severity: 'info',
        });
      }
    }
  }
}

/**
 * Flag complex business logic that might need refactoring
 * High cyclomatic complexity, nested conditions, etc.
 */
async function flagComplexBusinessLogic(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Count nested conditions and loops
  const nestedPattern = /if\s*\([^)]*\)\s*{[^}]*if\s*\([^)]*\)/g;
  const nestedMatches = content.match(nestedPattern) || [];

  if (nestedMatches.length > 3) {
    issues.push(
      `High nesting complexity detected (${nestedMatches.length} nested conditions) - consider extracting functions`
    );
  }

  // Count long function bodies
  const longFunctionPattern = /function\s+\w+[^{]*{([^}]+(?:{[^}]*}[^}]*)*)/g;
  let match;

  while ((match = longFunctionPattern.exec(content)) !== null) {
    const functionBody = match[1];
    const complexity = (functionBody.match(/if|for|while|switch|catch/g) || []).length;

    if (complexity > 8) {
      issues.push('High cyclomatic complexity detected - consider breaking down complex logic');
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Flag potential cognitive load issues
 * Multiple responsibilities, unclear abstractions, etc.
 */
async function flagCognitiveLoad(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];

  // Count imports as indicator of complexity
  const importCount = (content.match(/require\(/g) || []).length;

  if (importCount > 10) {
    issues.push(`High import count (${importCount}) - may indicate feature doing too many things`);
  }

  // Check for mixed abstraction levels
  const hasHighLevelOperations = /await\s+\w+Process|await\s+\w+Workflow|await\s+handle\w+/.test(
    content
  );
  const hasLowLevelOperations = /fs\.|path\.|JSON\.|String\./.test(content);

  if (hasHighLevelOperations && hasLowLevelOperations) {
    issues.push(
      'Mixed abstraction levels detected - consider separating high-level workflows from low-level utilities'
    );
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Flag cross-domain dependencies that might violate DDD
 * Direct imports between domains, circular dependencies, etc.
 */
async function flagCrossDomainDependencies(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
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
 * Repeated code patterns, similar functions, etc.
 */
async function flagAbstractionOpportunities(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
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

  return { passed: issues.length === 0, issues };
}

// === REPORTING SYSTEM ===

/**
 * Generate comprehensive audit report
 * Provides summary, details, and actionable guidance
 */
function generateAuditReport(results, duration, options) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ARCHITECTURE AUDIT REPORT');
  console.log('='.repeat(80));

  // Overall summary
  const totalPassed = results.tier1.passed + results.tier2.passed + results.tier3.passed;
  const totalFailed = results.tier1.failed + results.tier2.failed + results.tier3.failed;
  const totalChecks = totalPassed + totalFailed;

  console.log('\n🎯 SUMMARY');
  console.log(`   Total Files Analyzed: ${results.summary.totalFiles}`);
  console.log(`   Total Checks: ${totalChecks}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(
    `   Overall: ${totalPassed}/${totalChecks} checks passed (${Math.round((totalPassed / totalChecks) * 100)}%)`
  );

  // Tier-specific results
  console.log('\n⚡ TIER 1 - High Reliability (CI/CD Gate)');
  console.log(`   Passed: ${results.tier1.passed}`);
  console.log(`   Failed: ${results.tier1.failed}`);
  console.log(`   Status: ${results.tier1.failed === 0 ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n🎯 TIER 2 - Pattern Detection (Warnings)');
  console.log(`   Passed: ${results.tier2.passed}`);
  console.log(`   Failed: ${results.tier2.failed}`);
  console.log(`   Status: ${results.tier2.failed === 0 ? '✅ CLEAN' : '⚠️  ISSUES'}`);

  console.log('\n🚨 TIER 3 - Manual Review (Guidance)');
  console.log(`   Passed: ${results.tier3.passed}`);
  console.log(`   Failed: ${results.tier3.failed}`);
  console.log(`   Status: ${results.tier3.failed === 0 ? '✅ CLEAN' : 'ℹ️  REVIEW'}`);

  // Detailed issues
  if (options.verbose || results.tier1.failed > 0) {
    generateDetailedReport(results);
  }

  // Final recommendations
  console.log('\n🚀 RECOMMENDATIONS');
  if (results.tier1.failed > 0) {
    console.log(`   1. Fix ${results.tier1.failed} Tier 1 issues (CI/CD blockers)`);
  }
  if (results.tier2.failed > 0) {
    console.log(`   2. Review ${results.tier2.failed} Tier 2 warnings (code quality)`);
  }
  if (results.tier3.failed > 0) {
    console.log(
      `   3. Consider ${results.tier3.failed} Tier 3 suggestions (architectural improvements)`
    );
  }
  if (totalFailed === 0) {
    console.log('   🎉 Architecture is fully compliant with standards!');
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Generate detailed issue report by tier and rule
 */
function generateDetailedReport(results) {
  const allIssues = [...results.tier1.details, ...results.tier2.details, ...results.tier3.details];

  if (allIssues.length === 0) return;

  console.log('\n📋 DETAILED ISSUES');

  // Group by rule
  const issuesByRule = {};
  allIssues.forEach((issue) => {
    if (!issuesByRule[issue.rule]) {
      issuesByRule[issue.rule] = [];
    }
    issuesByRule[issue.rule].push(issue);
  });

  Object.entries(issuesByRule).forEach(([ruleName, ruleIssues]) => {
    const severity = ruleIssues[0].severity;
    const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';

    console.log(`\n${icon} ${ruleName} (${ruleIssues.length} files)`);

    ruleIssues.forEach((issue) => {
      console.log(`   📁 ${issue.file}`);
      issue.issues.forEach((msg) => {
        console.log(`      • ${msg}`);
      });
    });
  });
}

// === CLI INTEGRATION ===

/**
 * CLI entry point with argument parsing
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    tier1Only: args.includes('--tier1-only'),
    tier2Only: args.includes('--tier2-only'),
    tier3Only: args.includes('--tier3-only'),
    help: args.includes('--help') || args.includes('-h'),
  };

  if (options.help) {
    console.log(`
🔍 Architecture Standards Audit Script

USAGE:
  npm run audit                     # Run full audit
  npm run audit -- --verbose       # Show all details
  npm run audit -- --tier1-only    # Only CI/CD gate checks
  npm run audit -- --tier2-only    # Only pattern detection
  npm run audit -- --tier3-only    # Only manual review flags

TIERS:
  Tier 1: High Reliability (90-100% accurate) - CI/CD gate
  Tier 2: Pattern Detection (70-90% accurate) - Warnings  
  Tier 3: Manual Review (guidance only) - Suggestions

INTEGRATION:
  • Husky pre-commit: runs --tier1-only automatically
  • CI/CD pipeline: runs full audit, fails on Tier 1 issues
  • Development: run with --verbose for complete analysis
    `);
    process.exit(0);
  }

  runArchitectureAudit(options);
}

module.exports = {
  runArchitectureAudit,
  discoverAuditableFiles,
  auditFileStructure,
  auditImportOrganization,
  auditExportPatterns,
  auditActionFramework,
  auditNamingConventions,
  auditJSDocDocumentation,
  auditStepComments,
  auditFileHeaders,
  auditFeatureConfigurationBoundaries,
  auditOperationConfigurationUsage,
  auditConfigurationDocumentation,
};
