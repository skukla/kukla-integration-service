/**
 * App Audit - Tier 3 Audits Feature Core
 * Manual review flags (guidance only) with organized sub-modules
 */

// Import audit operations from sub-modules
const { flagAbstractionOpportunities } = require('./tier3-audits/abstraction-opportunities');
const { flagCrossDomainDependencies } = require('./tier3-audits/cross-domain-dependencies');
const { flagPerformanceConsiderations } = require('./tier3-audits/performance-considerations');
const { flagSecurityPatterns } = require('./tier3-audits/security-patterns');
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

module.exports = {
  executeTier3Audits,
  flagCrossDomainDependencies,
  flagAbstractionOpportunities,
  flagPerformanceConsiderations,
  flagSecurityPatterns,
};
