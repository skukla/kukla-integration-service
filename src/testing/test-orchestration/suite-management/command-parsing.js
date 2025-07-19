/**
 * Suite Management - Command Parsing Sub-module
 * Command line argument parsing and test suite determination utilities
 */

// Workflows

/**
 * Parse test command arguments
 * @purpose Extract structured information from command line arguments
 * @param {Array} args - Array of command line arguments
 * @returns {Object} Parsed arguments object
 * @usedBy parseTestOrchestrationOptions
 */
function parseTestCommandArgs(args) {
  const parsed = {
    flags: [],
    options: {},
    targets: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long option (--option=value or --option value)
      const [key, value] = arg.substring(2).split('=');

      if (value !== undefined) {
        parsed.options[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.options[key] = args[i + 1];
        i++; // Skip next argument
      } else {
        parsed.flags.push(key);
      }
    } else if (arg.startsWith('-')) {
      // Short flag
      parsed.flags.push(arg.substring(1));
    } else {
      // Target or positional argument
      parsed.targets.push(arg);
    }
  }

  return parsed;
}

/**
 * Determine appropriate test suite based on command and target
 * @purpose Select the most appropriate test suite for execution
 * @param {string} command - Test command type
 * @param {string} target - Test target
 * @param {string} explicitSuite - Explicitly specified suite (optional)
 * @returns {string} Selected test suite name
 * @usedBy parseTestOrchestrationOptions
 */
function determinateTestSuite(command, target, explicitSuite) {
  // If suite is explicitly specified, use it
  if (explicitSuite) {
    return explicitSuite;
  }

  // Determine suite based on command and target
  const suiteMapping = {
    action: 'action-suite',
    api: 'api-suite',
    performance: 'performance-suite',
    suite: 'comprehensive-suite',
    auto: determineAutoSuite(target),
  };

  return suiteMapping[command] || 'default-suite';
}

// Utilities

/**
 * Determine automatic test suite based on target
 * @purpose Intelligently select test suite when command is 'auto'
 * @param {string} target - Test target
 * @returns {string} Automatically determined suite name
 * @usedBy determinateTestSuite
 */
function determineAutoSuite(target) {
  // Action targets
  if (
    ['get-products', 'get-products-mesh', 'browse-files', 'download-file', 'delete-file'].includes(
      target
    )
  ) {
    return 'action-suite';
  }

  // API targets
  if (['products', 'categories', 'customers', 'orders'].includes(target)) {
    return 'api-suite';
  }

  // Performance targets
  if (target.includes('performance') || target.includes('stress')) {
    return 'performance-suite';
  }

  // Default comprehensive suite
  return 'comprehensive-suite';
}

module.exports = {
  // Workflows
  parseTestCommandArgs,
  determinateTestSuite,

  // Utilities
  determineAutoSuite,
};
