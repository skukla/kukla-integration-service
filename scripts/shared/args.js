/**
 * Scripts Core - Argument Parsing Utilities
 * Shared argument parsing functions for consistent CLI interface across all Feature-First scripts
 */

/**
 * Parse common CLI arguments with standard help and verbose support
 * @param {Array<string>} args - Process arguments (from process.argv.slice(2))
 * @returns {Object} Parsed arguments with common flags and remaining args
 */
function parseCommonArgs(args) {
  const commonFlags = {
    help: args.includes('--help') || args.includes('-h'),
    verbose: !args.includes('--quiet') && !args.includes('-q'),
    bail: args.includes('--bail') || args.includes('-b'),
    strict: args.includes('--strict') || args.includes('-s'),
  };

  // Extract non-flag arguments
  const nonFlagArgs = args.filter((arg) => !arg.startsWith('-'));

  // Extract custom flag values
  const customFlags = {};
  args.forEach((arg) => {
    if (arg.includes('=')) {
      const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
      const value = valueParts.join('=');
      customFlags[key] = value;
    }
  });

  return {
    ...commonFlags,
    ...customFlags,
    nonFlagArgs,
    rawArgs: args,
  };
}

/**
 * Display help for any script with consistent formatting
 * @param {string} scriptName - Name of the script (e.g., 'audit', 'test', 'deploy')
 * @param {string} usage - Usage string (e.g., 'npm run audit [options]')
 * @param {Array<Object>} options - Array of option objects with {flag, description}
 * @param {Array<Object>} examples - Array of example objects with {command, description}
 */
function displayHelp(scriptName, usage, options = [], examples = []) {
  const format = require('./formatting');

  console.log(format.info(`📋 ${scriptName.toUpperCase()} HELP`));
  console.log('');
  console.log(`Usage: ${usage}`);
  console.log('');

  if (options.length > 0) {
    console.log('Options:');
    options.forEach((opt) => {
      console.log(`  ${opt.flag.padEnd(20)} ${opt.description}`);
    });
    console.log('');
  }

  if (examples.length > 0) {
    console.log('Examples:');
    examples.forEach((ex) => {
      console.log(`  ${ex.command}`);
      console.log(`    ${format.muted(ex.description)}`);
    });
    console.log('');
  }

  // Common flags always available
  console.log('Common Options:');
  console.log('  --help, -h           Show this help message');
  console.log('  --quiet, -q          Suppress verbose output');
  console.log('  --bail, -b           Exit on first failure');
  console.log('  --strict, -s         Enable strict mode');
}

/**
 * Parse command line arguments for deploy scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseDeployArgs(args) {
  const common = parseCommonArgs(args);

  return {
    ...common,
    meshOnly: args.includes('--mesh-only'),
    isProd: args.includes('--prod') || args.includes('--production'),
    environment: args.find((arg) => arg.startsWith('--environment='))?.split('=')[1],
  };
}

/**
 * Parse command line arguments for test scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseTestArgs(args) {
  const common = parseCommonArgs(args);
  const [testType, target] = common.nonFlagArgs;

  return {
    ...common,
    testType: testType || 'action',
    target: target || 'get-products',
    scenario: common.scenario || 'quick',
    timeout: parseInt(common.timeout) || 10000,
    retries: parseInt(common.retries) || 3,
  };
}

/**
 * Parse command line arguments for audit scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseAuditArgs(args) {
  const common = parseCommonArgs(args);

  return {
    ...common,
    scriptsOnly: args.includes('--scripts-only'),
    tier: common.tier || 'all',
  };
}

/**
 * Parse command line arguments for monitor scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseMonitorArgs(args) {
  const common = parseCommonArgs(args);

  return {
    ...common,
    fileName: common.file || common.nonFlagArgs[0] || 'products.csv',
    useCase: common['use-case'] || 'adobeTarget',
  };
}

/**
 * Parse command line arguments for build scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseBuildArgs(args) {
  const common = parseCommonArgs(args);

  return {
    ...common,
    skipMesh: args.includes('--skip-mesh'),
    skipFrontend: args.includes('--skip-frontend'),
    watch: args.includes('--watch'),
  };
}

module.exports = {
  // Common utilities
  parseCommonArgs,
  displayHelp,

  // Domain-specific parsers
  parseDeployArgs,
  parseTestArgs,
  parseAuditArgs,
  parseMonitorArgs,
  parseBuildArgs,
};
