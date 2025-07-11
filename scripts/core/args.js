/**
 * Scripts Core - Argument Parsing Utilities
 * Shared argument parsing functions for consistent CLI interface
 */

/**
 * Parse command line arguments for deploy scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseDeployArgs(args) {
  return {
    help: args.includes('--help'),
    meshOnly: args.includes('--mesh-only'),
    environment: args.find((arg) => arg.startsWith('--environment='))?.split('=')[1],
  };
}

/**
 * Parse command line arguments for test scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseTestArgs(args) {
  const actionName = args.find((arg) => !arg.startsWith('--') && !arg.includes('='));

  // Parse parameters in key=value format
  const paramArgs = args.filter((arg) => arg.includes('=') && !arg.startsWith('--'));
  const params = {};
  paramArgs.forEach((param) => {
    const [key, ...valueParts] = param.split('=');
    const value = valueParts.join('='); // Handle values that contain '='

    try {
      params[key] = JSON.parse(value);
    } catch {
      params[key] = value;
    }
  });

  return {
    help: args.includes('--help'),
    actionName,
    params,
    raw: args.includes('--raw'),
  };
}

/**
 * Parse command line arguments for build scripts
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseBuildArgs(args) {
  return {
    help: args.includes('--help'),
    configOnly: args.includes('--config-only'),
    meshOnly: args.includes('--mesh-only'),
  };
}

/**
 * Display help message for deploy commands
 */
function showDeployHelp() {
  console.log(`
Usage: npm run deploy [options]

Options:
  --help              Show this help message
  --mesh-only         Deploy only the API Mesh (skip app deployment)
  --environment=ENV   Target environment (staging/production)

  `);
}

/**
 * Display help message for test commands
 */
function showTestHelp() {
  console.log(`
Usage: npm run test:action <action> [key=value ...] [options]
       npm run test:api <endpoint> [key=value ...] [options]
       npm run test:perf <action> [scenario] [options]
       npm run test:suite [suite] [options]

Test Types:
  test:action   Test individual App Builder actions
  test:api      Test API endpoints directly
  test:perf     Performance testing with scenarios
  test:suite    Run test suites (smoke/regression/performance)

Options:
  --help        Show this help message
  --raw         Output raw JSON response only (action tests)
  --prod        Run tests against production environment
  --fail-fast   Stop on first failure (suite tests)

Examples:
  npm run test:action get-products
  npm run test:action delete-file fileName=products.csv
  npm run test:api get-products
  npm run test:perf get-products baseline
  npm run test:perf list
  npm run test:suite smoke
  npm run test:suite list
  `);
}

/**
 * Display help message for build commands
 */
function showBuildHelp() {
  console.log(`
Usage: npm run build [options]

Options:
  --help        Show this help message
  --config-only Build only frontend configuration
  --mesh-only   Build only mesh resolver
  `);
}

module.exports = {
  parseDeployArgs,
  parseTestArgs,
  parseBuildArgs,
  showDeployHelp,
  showTestHelp,
  showBuildHelp,
};
