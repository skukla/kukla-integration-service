#!/usr/bin/env node

/**
 * App Audit Test - Feature Core
 * Complete audit test suite capability with organized sub-modules for different testing domains
 */

// All dependencies at top - external vs internal clear from paths
const { loadConfig } = require('../config');
const { executeAuditValidation } = require('./audit-test/audit-validation');
const { calculateConfidenceScores } = require('./audit-test/confidence-scoring');
const { executeSuiteOrchestration } = require('./audit-test/suite-execution');
const { generateTestCases } = require('./audit-test/test-case-generation');
const { displayHelp } = require('./shared/args');
const format = require('./shared/formatting');

// Business Workflows

/**
 * Complete audit test suite workflow with all test types
 * @purpose Execute comprehensive audit testing including test case generation, validation, and confidence scoring
 * @param {Object} options - Test options
 * @param {string} options.target - Target audit component to test
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<Object>} Test result with all components
 * @usedBy audit test CLI entry point
 */
async function auditTestWithAllComponents(options = {}) {
  console.log('🧪 Audit Test Suite\n');

  const startTime = Date.now();
  const testResults = {
    generated: 0,
    passed: 0,
    failed: 0,
    confidence: { total: 0, average: 0 },
    details: [],
  };

  try {
    // Step 1: Load configuration
    const config = loadConfig({});

    // Step 2: Generate test cases
    console.log(format.info('Generating test cases...'));
    const testCases = await generateTestCases(options.target, config);
    testResults.generated = testCases.length;

    console.log(format.info('Executing audit validation...'));

    // Step 1: Execute complete audit validation workflow
    const auditValidationResult = await executeAuditValidation(testCases, config);

    // Step 4: Calculate confidence scores
    console.log('📊 Calculating confidence scores...');
    const confidenceResults = await calculateConfidenceScores(auditValidationResult, config);

    // Step 5: Execute suite orchestration
    console.log(format.info('Orchestrating test suite...'));
    const orchestrationResults = await executeSuiteOrchestration(confidenceResults, options);

    // Step 6: Generate final results
    const duration = Date.now() - startTime;

    return {
      success: orchestrationResults.success,
      testResults: {
        ...testResults,
        ...orchestrationResults,
      },
      duration,
      exitCode: orchestrationResults.success ? 0 : 1,
    };
  } catch (error) {
    console.error('💥 Audit test execution failed:', error.message);
    return {
      success: false,
      error: error.message,
      exitCode: 1,
    };
  }
}

/**
 * Standard audit test workflow
 * @purpose Execute audit test with standard configuration
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 * @usedBy Scripts requiring simplified audit test interface
 */
async function auditTest(options = {}) {
  return await auditTestWithAllComponents(options);
}

// Feature Operations

/**
 * Validate specific audit component
 * @purpose Test a specific audit rule or component
 * @param {string} target - Target component to test
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Validation result
 * @usedBy auditTestWithAllComponents
 */
async function validateAuditComponent(target, config) {
  const testCases = await generateTestCases(target, config);
  const validationResults = await executeAuditValidation(testCases, config);

  return {
    target,
    testCases: testCases.length,
    passed: validationResults.passed,
    failed: validationResults.failed,
    details: validationResults.details,
  };
}

/**
 * Run confidence analysis on audit results
 * @purpose Analyze confidence levels of audit rules
 * @param {Array} auditResults - Audit results to analyze
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Confidence analysis
 * @usedBy auditTestWithAllComponents
 */
async function runConfidenceAnalysis(auditResults, config) {
  return await calculateConfidenceScores(auditResults, config);
}

// Feature Utilities

/**
 * Load audit test configuration
 * @purpose Get complete configuration for audit test operations
 * @returns {Object} Audit test configuration
 * @usedBy All audit test workflows
 */
function loadAuditTestConfig() {
  const config = loadConfig({});
  return {
    ...config,
    auditTest: config.scripts.auditTest,
  };
}

/**
 * Parse audit test command line arguments
 * @purpose Extract audit test options from CLI arguments
 * @param {Array<string>} args - Command line arguments
 * @returns {Object} Parsed arguments
 * @usedBy main CLI function
 */
function parseAuditTestArguments(args) {
  const options = {
    target: 'all',
    verbose: false,
    timeout: 30000,
  };

  // Extract target
  const targetIndex = args.indexOf('--target');
  if (targetIndex !== -1 && args[targetIndex + 1]) {
    options.target = args[targetIndex + 1];
  }

  // Extract flags
  if (args.includes('--verbose') || args.includes('-v')) {
    options.verbose = true;
  }

  // Extract timeout
  const timeoutIndex = args.indexOf('--timeout');
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    options.timeout = parseInt(args[timeoutIndex + 1]) || 30000;
  }

  return options;
}

// CLI Entry Point

/**
 * Main CLI function
 * @purpose Handle command line arguments and execute appropriate audit test workflow
 * @returns {Promise<void>} CLI execution completion
 * @usedBy CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp(
      'audit-test',
      'npm run audit:test [options]',
      [
        { flag: '--target <path>', description: 'Target directory or file to test' },
        { flag: '--verbose', description: 'Show detailed test output' },
      ],
      [
        { command: 'npm run audit:test', description: 'Run audit tests on all files' },
        { command: 'npm run audit:test -- --target src/', description: 'Test specific directory' },
      ]
    );
    return;
  }

  // Parse arguments
  const options = parseAuditTestArguments(args);

  // Execute audit test workflow
  const result = await auditTestWithAllComponents(options);

  // Display results
  if (options.verbose || !result.success) {
    console.log('\n📊 Audit Test Results:');
    console.log(`   Target: ${options.target}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   ${result.success ? format.success('Success') : format.error('Failed')}`);
  }

  // Exit with appropriate code
  process.exit(result.exitCode);
}

// CLI Integration
if (require.main === module) {
  main().catch((error) => {
    console.error(format.error(`Audit test failed: ${error.message}`));
    process.exit(1);
  });
}

module.exports = {
  auditTestWithAllComponents,
  auditTest,
  validateAuditComponent,
  runConfidenceAnalysis,
  loadAuditTestConfig,
};
