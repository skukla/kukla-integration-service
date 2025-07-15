/**
 * Test Domain - Argument Resolution Operations
 * Pure operations for resolving test arguments into testType and target
 */

/**
 * Resolve test type and target from parsed arguments
 * Pure function that determines the appropriate testType and target based on argument patterns
 *
 * @param {Object} args - Parsed arguments from parseTestArgs
 * @returns {Object} Resolved test configuration
 */
function resolveTestConfiguration(args) {
  let testType, target;

  // Handle standardized --type flag format
  if (args.testType) {
    testType = args.testType;
    target = args.actionName || args.params.scenario || args.params.name;
  }
  // Handle action testing with --action flag
  else if (args.actionName) {
    testType = 'action';
    target = args.actionName;
  }
  // Fallback to legacy positional arguments for compatibility
  else {
    testType = process.argv[2];
    target = process.argv[3];
  }

  return {
    testType,
    target,
    options: {
      params: args.params,
      isProd: args.prod,
      rawOutput: args.raw,
      failFast: args.failFast,
      list: args.list,
    },
  };
}

/**
 * Check if arguments suggest an invalid action test format
 * Pure function that detects when user likely meant to use --action format
 *
 * @param {Object} args - Parsed arguments
 * @param {string} testType - Resolved test type
 * @returns {Object} Format validation result
 */
function validateArgumentFormat(args, testType) {
  // Check if this looks like an action test with wrong format
  // This happens when someone provides a positional argument that's not a valid test type
  const VALID_TEST_TYPES = ['action', 'api', 'performance', 'perf', 'suite'];
  const hasInvalidActionFormat =
    !args.testType && // No explicit --type flag
    !args.actionName && // No explicit --action flag
    testType && // testType was set from positional args
    !VALID_TEST_TYPES.includes(testType) && // Not a valid test type
    process.argv[2] &&
    !process.argv[2].startsWith('--'); // Positional argument that doesn't start with --

  return {
    isValidFormat: !hasInvalidActionFormat,
    suggestedAction: hasInvalidActionFormat ? testType : null,
  };
}

/**
 * Validate that required test arguments are present
 * Pure function that checks if testType or target are provided
 *
 * @param {string} testType - Resolved test type
 * @param {string} target - Resolved target
 * @returns {Object} Validation result
 */
function validateRequiredArguments(testType, target) {
  const hasRequired = testType || target;

  return {
    isValid: hasRequired,
    message: hasRequired ? null : 'Test type or action name is required',
  };
}

module.exports = {
  resolveTestConfiguration,
  validateArgumentFormat,
  validateRequiredArguments,
};
