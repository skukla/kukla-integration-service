/**
 * App Audit - Report Generation Sub-module
 * Audit report formatting and display utilities
 */

// Report Generation Workflows

/**
 * Generate comprehensive audit report
 * @purpose Format and display audit results with appropriate colors and formatting
 * @param {Object} auditResults - Complete audit results from all tiers
 * @param {number} duration - Audit execution duration in milliseconds
 * @returns {void} Console output only
 * @usedBy app-audit.js auditAppWithAllComponents
 */
function generateAuditReport(auditResults, duration, options = {}) {
  console.log('\n================================================================================');
  console.log('📊 ARCHITECTURE AUDIT REPORT');
  console.log('================================================================================');

  // Display summary
  displayAuditSummary(auditResults, duration);

  // Display tier results
  displayTierResults(auditResults);

  // Display detailed issues if verbose or failures exist
  if (options.verbose || hasCriticalFailures(auditResults)) {
    displayDetailedIssues(auditResults, options);
  }

  // Display recommendations
  displayRecommendations(auditResults);
}

// Report Generation Operations

/**
 * Display audit summary statistics
 * @purpose Show high-level audit metrics and overall status
 * @param {Object} auditResults - Audit results
 * @param {number} duration - Audit duration
 * @returns {void} Console output only
 * @usedBy generateAuditReport
 */
function displayAuditSummary(auditResults, duration) {
  const totalPassed =
    auditResults.tier1.passed + auditResults.tier2.passed + auditResults.tier3.passed;
  const totalFailed =
    auditResults.tier1.failed + auditResults.tier2.failed + auditResults.tier3.failed;
  const totalChecks = totalPassed + totalFailed;
  const passPercentage = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 100;

  console.log('\n🎯 SUMMARY');
  console.log(`   Total Files Analyzed: ${auditResults.summary.totalFiles}`);
  console.log(`   Total Checks: ${totalChecks}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   Overall: ${totalPassed}/${totalChecks} checks passed (${passPercentage}%)`);
}

/**
 * Display results for each audit tier
 * @purpose Show tier-specific results with appropriate status indicators
 * @param {Object} auditResults - Audit results
 * @returns {void} Console output only
 * @usedBy generateAuditReport
 */
function displayTierResults(auditResults) {
  // Tier 1 Results
  const tier1Status = auditResults.tier1.failed === 0 ? '✅ PASS' : '❌ FAIL';
  console.log('\n⚡ TIER 1 - High Reliability (CI/CD Gate)');
  console.log(`   Passed: ${auditResults.tier1.passed}`);
  console.log(`   Failed: ${auditResults.tier1.failed}`);
  console.log(`   Status: ${tier1Status}`);

  // Tier 2 Results
  const tier2Status = auditResults.tier2.failed === 0 ? '✅ PASS' : '⚠️ WARNINGS';
  console.log('\n🎯 TIER 2 - Pattern Detection (Warnings)');
  console.log(`   Passed: ${auditResults.tier2.passed}`);
  console.log(`   Failed: ${auditResults.tier2.failed}`);
  console.log(`   Status: ${tier2Status}`);

  // Tier 3 Results
  console.log('\n🚨 TIER 3 - Manual Review (Guidance)');
  console.log(`   Passed: ${auditResults.tier3.passed}`);
  console.log(`   Issues: ${auditResults.tier3.failed}`);
  console.log('   Status: 📝 REVIEW');
}

/**
 * Display detailed issues when requested or critical failures exist
 * @purpose Show specific issues found during audit
 * @param {Object} auditResults - Audit results
 * @param {Object} options - Display options
 * @returns {void} Console output only
 * @usedBy generateAuditReport
 */
function displayDetailedIssues(auditResults, options) {
  console.log('\n🔍 DETAILED ISSUES');

  // Group issues by severity
  const allIssues = [
    ...auditResults.tier1.details,
    ...auditResults.tier2.details,
    ...auditResults.tier3.details,
  ];

  const issuesBySeverity = groupIssuesBySeverity(allIssues);

  // Display errors first (most critical)
  if (issuesBySeverity.error.length > 0) {
    console.log('\n❌ ERRORS (Tier 1 - Must Fix)');
    displayIssueGroup(issuesBySeverity.error, options);
  }

  // Display warnings (should fix)
  if (issuesBySeverity.warning.length > 0 && options.verbose) {
    console.log('\n⚠️ WARNINGS (Tier 2 - Should Fix)');
    displayIssueGroup(issuesBySeverity.warning, options);
  }

  // Display info (consider fixing)
  if (issuesBySeverity.info.length > 0 && options.verbose) {
    console.log('\n📝 SUGGESTIONS (Tier 3 - Consider)');
    displayIssueGroup(issuesBySeverity.info, options);
  }
}

/**
 * Display recommendations based on audit results
 * @purpose Provide actionable recommendations based on findings
 * @param {Object} auditResults - Audit results
 * @returns {void} Console output only
 * @usedBy generateAuditReport
 */
function displayRecommendations(auditResults) {
  console.log('\n💡 RECOMMENDATIONS');

  const tier1Failed = auditResults.tier1.failed;
  const tier2Failed = auditResults.tier2.failed;
  const tier3Failed = auditResults.tier3.failed;

  if (tier1Failed === 0 && tier2Failed === 0 && tier3Failed === 0) {
    console.log('   🎉 Excellent! Your codebase follows all architecture standards.');
    console.log('   Continue maintaining these high standards in future development.');
    return;
  }

  if (tier1Failed > 0) {
    console.log('   🚨 Priority 1: Fix Tier 1 errors before deployment');
    console.log('      These are high-confidence issues that affect code quality');
  }

  if (tier2Failed > 10) {
    console.log('   ⚠️ Priority 2: Address Tier 2 warnings in upcoming sprints');
    console.log('      These patterns may indicate architectural debt');
  }

  if (tier3Failed > 20) {
    console.log('   📝 Priority 3: Review Tier 3 suggestions during refactoring');
    console.log('      These are opportunities for improvement');
  }

  // Specific recommendations based on common issues
  const commonIssues = analyzeCommonIssues(auditResults);
  if (commonIssues.length > 0) {
    console.log('\n   📋 Common Issues Detected:');
    commonIssues.forEach((issue) => {
      console.log(`      • ${issue}`);
    });
  }
}

// Report Generation Utilities

/**
 * Check if there are critical failures that require immediate attention
 * @purpose Determine if detailed issues should be displayed automatically
 * @param {Object} auditResults - Audit results
 * @returns {boolean} True if critical failures exist
 * @usedBy generateAuditReport
 */
function hasCriticalFailures(auditResults) {
  return auditResults.tier1.failed > 0;
}

/**
 * Group issues by severity level
 * @purpose Organize issues for appropriate display formatting
 * @param {Array} allIssues - All issues from all tiers
 * @returns {Object} Issues grouped by severity
 * @usedBy displayDetailedIssues
 */
function groupIssuesBySeverity(allIssues) {
  return allIssues.reduce(
    (groups, issue) => {
      const severity = issue.severity || 'info';
      if (!groups[severity]) {
        groups[severity] = [];
      }
      groups[severity].push(issue);
      return groups;
    },
    { error: [], warning: [], info: [] }
  );
}

/**
 * Display a group of issues with consistent formatting
 * @purpose Format and display issues of the same severity
 * @param {Array} issues - Issues to display
 * @param {Object} options - Display options
 * @returns {void} Console output only
 * @usedBy displayDetailedIssues
 */
function displayIssueGroup(issues, options) {
  // Limit display if not verbose
  const maxIssues = options.verbose ? issues.length : Math.min(5, issues.length);

  for (let i = 0; i < maxIssues; i++) {
    const issue = issues[i];
    console.log(`\n   📁 ${issue.file}`);
    console.log(`   🔧 Rule: ${issue.rule}`);

    if (issue.issues && issue.issues.length > 0) {
      issue.issues.forEach((problemDescription) => {
        console.log(`      • ${problemDescription}`);
      });
    }
  }

  if (issues.length > maxIssues) {
    console.log(`\n   ... and ${issues.length - maxIssues} more issues`);
    console.log('   Use --verbose flag to see all issues');
  }
}

/**
 * Analyze common issue patterns across audit results
 * @purpose Identify frequent problems for targeted recommendations
 * @param {Object} auditResults - Audit results
 * @returns {Array<string>} Array of common issue descriptions
 * @usedBy displayRecommendations
 */
function analyzeCommonIssues(auditResults) {
  const commonIssues = [];
  const allIssues = [
    ...auditResults.tier1.details,
    ...auditResults.tier2.details,
    ...auditResults.tier3.details,
  ];

  // Count issue types
  const issueTypes = {};
  allIssues.forEach((issue) => {
    const rule = issue.rule;
    issueTypes[rule] = (issueTypes[rule] || 0) + 1;
  });

  // Identify common problems (appearing in multiple files)
  Object.entries(issueTypes).forEach(([rule, count]) => {
    if (count >= 3) {
      const description = getIssueDescription(rule, count);
      commonIssues.push(description);
    }
  });

  return commonIssues;
}

/**
 * Get human-readable description for issue types
 * @purpose Provide clear descriptions for common issues
 * @param {string} rule - Rule name
 * @param {number} count - Number of occurrences
 * @returns {string} Human-readable issue description
 * @usedBy analyzeCommonIssues
 */
function getIssueDescription(rule, count) {
  const descriptions = {
    'import-organization': `Import organization issues in ${count} files - use section comments for 4+ imports`,
    'export-patterns': `Export pattern issues in ${count} files - use consistent module.exports structure`,
    'action-framework': `Action framework issues in ${count} files - ensure createAction() usage`,
    'naming-conventions': `Naming convention issues in ${count} files - use camelCase functions, kebab-case files`,
    'jsdoc-documentation': `JSDoc documentation missing in ${count} files - add @purpose tags`,
    'function-organization-within-files': `Function organization issues in ${count} files - use progressive disclosure`,
    'configuration-access-patterns': `Configuration pattern issues in ${count} files - avoid optional chaining with fallbacks`,
    'feature-first-organization': `Layer-first organization in ${count} files - consider Feature-First approach`,
  };

  return descriptions[rule] || `${rule} issues in ${count} files`;
}

module.exports = {
  // Workflows
  generateAuditReport,

  // Operations
  displayAuditSummary,
  displayTierResults,
  displayDetailedIssues,
  displayRecommendations,
};
