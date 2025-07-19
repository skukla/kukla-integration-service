/**
 * App Audit - Tier 2 Audits Feature Core
 * Pattern detection audit rules (70-90% accurate) - Used for warnings
 */

// Import from tier2-audits sub-modules
const {
  auditFunctionLength,
  auditFileSize,
  auditConfigurationPatterns,
  auditFeatureFirstOrganization,
} = require('./tier2-audits/basic-audits');
const {
  auditCrossDomainFunctionDuplication,
  auditValidationPatternDuplication,
  auditResponseBuildingDuplication,
} = require('./tier2-audits/duplication-detection');
const { auditSharedUtilityOpportunities } = require('./tier2-audits/utility-opportunities');
const { subInfo } = require('../shared/formatting');

// Tier 2 Audit Workflows

/**
 * Execute Tier 2 audits - Pattern detection with moderate reliability
 * @purpose Execute pattern detection audits that are 70-90% accurate
 * @param {Array<string>} files - Files to audit
 * @param {Object} results - Results object to populate
 * @returns {Promise<void>} Updates results object with tier 2 audit results
 * @usedBy app-audit.js auditAppWithAllComponents
 */
async function executeTier2Audits(files, results) {
  const tier2Rules = [
    { name: 'function-length-guidelines', fn: auditFunctionLength },
    { name: 'file-size-limits', fn: auditFileSize },
    { name: 'configuration-access-patterns', fn: auditConfigurationPatterns },
    { name: 'feature-first-organization', fn: auditFeatureFirstOrganization },
    { name: 'cross-domain-function-duplication', fn: auditCrossDomainFunctionDuplication },
    { name: 'validation-pattern-duplication', fn: auditValidationPatternDuplication },
    { name: 'response-building-duplication', fn: auditResponseBuildingDuplication },
    { name: 'shared-utility-opportunities', fn: auditSharedUtilityOpportunities },
  ];

  for (const rule of tier2Rules) {
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

module.exports = {
  // Tier 2 audit workflows
  executeTier2Audits,

  // Tier 2 audit operations (re-exported from sub-modules)
  auditFunctionLength,
  auditFileSize,
  auditConfigurationPatterns,
  auditFeatureFirstOrganization,
  auditCrossDomainFunctionDuplication,
  auditValidationPatternDuplication,
  auditResponseBuildingDuplication,
  auditSharedUtilityOpportunities,
};
