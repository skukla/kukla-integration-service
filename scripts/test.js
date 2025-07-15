#!/usr/bin/env node

/**
 * Test Script - Light DDD Entry Point
 * Clean orchestrator that delegates to operations following Light DDD principles
 */

const { parseTestArgs, showTestHelp } = require('./core/args');
const { executeScriptWithExit } = require('./core/operations/script-framework');
const {
  resolveTestConfiguration,
  validateArgumentFormat,
  validateRequiredArguments,
} = require('./test/operations/argument-resolution');
const {
  displayInvalidFormatError,
  displayMissingArgumentsError,
  displayTestExecutionError,
} = require('./test/operations/help-display');
const { dispatchTest } = require('./test/operations/test-dispatch');

/**
 * Main function - Clean orchestrator following Light DDD principles
 * Delegates all business logic to focused operations
 */
async function main() {
  const args = parseTestArgs(process.argv.slice(2));

  if (args.help) {
    showTestHelp();
    return;
  }

  // Step 1: Resolve test configuration from arguments
  const config = resolveTestConfiguration(args);
  const { testType, target, options } = config;

  // Step 2: Validate argument format
  const formatValidation = validateArgumentFormat(args, testType);
  if (!formatValidation.isValidFormat) {
    displayInvalidFormatError(formatValidation.suggestedAction);
    return;
  }

  // Step 3: Validate required arguments
  const argumentValidation = validateRequiredArguments(testType, target);
  if (!argumentValidation.isValid) {
    displayMissingArgumentsError(argumentValidation.message);
    return;
  }

  // Step 4: Execute test
  const result = await dispatchTest(testType, target, options);

  // Step 5: Handle results
  if (result.listed) {
    return;
  }

  if (!result.success) {
    displayTestExecutionError(testType, result.error);
    process.exit(1);
  }
}

if (require.main === module) {
  executeScriptWithExit('test', main);
}
