#!/usr/bin/env node

/**
 * App Audit - Feature Core
 * Complete architecture standards auditing capability with organized sub-modules for different audit domains
 */

const { glob } = require('glob');

const { loadConfig } = require('../config');
const { generateAuditReport } = require('./audit/report-generation');
const { executeTier1Audits } = require('./audit/tier1-audits');
const { executeTier2Audits } = require('./audit/tier2-audits');
const { executeTier3Audits } = require('./audit/tier3-audits');
const { parseAuditArgs, displayHelp } = require('./shared/args');
const format = require('./shared/formatting');

// Business Workflows

/**
 * Complete architecture audit workflow with all audit types
 * @purpose Execute comprehensive auditing including tier 1, 2, and 3 audits with report generation
 * @param {Object} options - Audit options
 * @param {boolean} options.verbose - Show detailed output
 * @param {boolean} options.bailOnFailure - Exit on first failure
 * @returns {Promise<Object>} Audit result with all components
 * @usedBy audit CLI entry point
 */
async function auditAppWithAllComponents(options = {}) {
  console.log(format.info('Architecture Standards Audit\n'));

  const startTime = Date.now();
  const auditResults = {
    summary: { totalFiles: 0, checkedFiles: 0, issues: 0 },
    tier1: { passed: 0, failed: 0, details: [] },
    tier2: { passed: 0, failed: 0, details: [] },
    tier3: { passed: 0, failed: 0, details: [] },
  };

  try {
    // Step 1: Discover all relevant files
    const files = await discoverAuditableFiles();
    auditResults.summary.totalFiles = files.length;

    console.log(format.info(`Analyzing ${files.length} files...\n`));

    // Step 2: Execute Tier 1 audits (High Reliability)
    console.log(format.info('Tier 1: High Reliability Rules (90-100% accurate)'));
    await executeTier1Audits(files, auditResults.tier1);

    // Step 3: Execute Tier 2 audits (Pattern Detection)
    console.log(format.info('\nTier 2: Pattern Detection Rules (70-90% accurate)'));
    await executeTier2Audits(files, auditResults.tier2);

    // Step 4: Execute Tier 3 audits (Manual Review Flags)
    console.log(format.info('\nTier 3: Manual Review Flags (guidance only)'));
    await executeTier3Audits(files, auditResults.tier3);

    // Step 5: Generate comprehensive report
    const duration = Date.now() - startTime;
    generateAuditReport(auditResults, duration, options);

    // Step 6: Exit with appropriate code
    const hasFailures = auditResults.tier1.failed > 0 || auditResults.tier2.failed > 0;

    return {
      success: !hasFailures,
      auditResults,
      duration,
      exitCode: hasFailures ? 1 : 0,
    };
  } catch (error) {
    console.error('💥 Audit execution failed:', error.message);
    return {
      success: false,
      error: error.message,
      exitCode: 1,
    };
  }
}

/**
 * Standard audit workflow
 * @purpose Execute audit with standard configuration
 * @param {Object} options - Audit options
 * @returns {Promise<Object>} Audit result
 * @usedBy Scripts requiring simplified audit interface
 */
async function auditApp(options = {}) {
  return await auditAppWithAllComponents(options);
}

// Feature Operations

/**
 * Discover all files that should be audited
 * @purpose Focuses on src/, actions/, scripts/, and config/ directories
 * @returns {Promise<Array<string>>} Array of file paths to audit
 * @usedBy auditAppWithAllComponents
 */
async function discoverAuditableFiles() {
  const config = loadConfig({});
  const auditConfig = config.scripts.audit;

  return await glob(auditConfig.patterns.include, {
    ignore: auditConfig.patterns.exclude,
  });
}

/**
 * Load audit configuration
 * @purpose Get complete configuration for audit operations
 * @returns {Object} Audit configuration
 * @usedBy All audit workflows
 */
function loadAuditConfig() {
  const config = loadConfig({});
  return {
    ...config,
    audit: config.scripts.audit,
  };
}

// Feature Utilities

// CLI Entry Point

/**
 * Main CLI function
 * @purpose Handle command line arguments and execute appropriate audit workflow
 * @returns {Promise<void>} CLI execution completion
 * @usedBy CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseAuditArgs(args);

  if (options.help) {
    displayHelp(
      'audit',
      'npm run audit [options]',
      [
        { flag: '--verbose, -v', description: 'Show detailed output' },
        { flag: '--strict, -s', description: 'Use strict validation mode' },
        { flag: '--scripts-only', description: 'Audit only scripts directory' },
        { flag: '--tier [1|2|3|all]', description: 'Run specific audit tier' },
      ],
      [
        { command: 'npm run audit', description: 'Standard audit' },
        { command: 'npm run audit -- --verbose', description: 'Detailed audit output' },
        { command: 'npm run audit -- --strict', description: 'Strict validation mode' },
        { command: 'npm run audit -- --scripts-only', description: 'Audit only scripts' },
      ]
    );
    return;
  }

  const result = await auditAppWithAllComponents(options);
  process.exit(result.exitCode);
}

// CLI Integration
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Audit execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  auditAppWithAllComponents,
  auditApp,
  discoverAuditableFiles,
  loadAuditConfig,
};
