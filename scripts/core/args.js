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
 * Supports GNU-style flags (--action=value, --type=api) and legacy key=value format
 * @param {Array<string>} args - Process arguments
 * @returns {Object} Parsed arguments
 */
function parseTestArgs(args) {
  const params = {};
  let actionName = null;
  let testType = null;

  // Parse all arguments
  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      // GNU-style flags: --action=get-products, --type=api, --use-case=adobeTarget
      if (arg.includes('=')) {
        const [flag, ...valueParts] = arg.substring(2).split('=');
        const value = valueParts.join('=');

        // Convert kebab-case to camelCase for internal consistency
        const key = flag.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        try {
          params[key] = JSON.parse(value);
        } catch {
          params[key] = value;
        }

        // Special handling for specific parameters
        if (key === 'action') {
          actionName = value;
        } else if (key === 'type') {
          testType = value;
        }
      }
    } else if (arg.includes('=') && !arg.startsWith('--')) {
      // Legacy key=value format: action=get-products
      const [key, ...valueParts] = arg.split('=');
      const value = valueParts.join('=');

      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }

      // Special handling for action parameter
      if (key === 'action') {
        actionName = value;
      }
    }
  });

  return {
    help: args.includes('--help'),
    actionName,
    testType,
    params,
    raw: args.includes('--raw'),
    prod: args.includes('--prod'),
    failFast: args.includes('--fail-fast'),
    list: args.includes('--list'),
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
  console.log(
    '\nUsage: npm run test:action [flags] [options]\n       npm run test:<action> [options]                       (specialized shortcuts)\n       npm run test:api <endpoint> [flags] [options]\n       npm run test:perf <action> [scenario] [options]\n       npm run test:suite [suite] [options]\n\nTest Types:\n  test:action            Test individual App Builder actions (generic)\n  test:<action>          Test specific action (specialized shortcuts)\n  test:api               Test API endpoints directly\n  test:perf              Performance testing with scenarios\n  test:suite             Run test suites (smoke/regression/performance)\n\nSpecialized Action Shortcuts:\n  test:get-products                Test get-products with default settings\n  test:get-products:target         Test get-products with Adobe Target (7-day expiration)\n  test:get-products:system         Test get-products with system access (48-hour expiration)\n  test:get-products-mesh           Test get-products-mesh with default settings\n  test:get-products-mesh:target    Test get-products-mesh with Adobe Target\n\nGeneric Action Testing:\n  npm run test:action --action=get-products\n  npm run test:action --action=get-products --use-case=adobeTarget\n  npm run test:action --action=get-products-mesh --use-case=system\n\nOptions:\n  --help                 Show this help message\n  --raw                  Output raw JSON response only (action tests)\n  --prod                 Run tests against production environment\n  --fail-fast            Stop on first failure (suite tests)\n\nFlags (GNU-style):\n  --action=<name>        Action name to test (REQUIRED for generic test:action)\n  --use-case=<type>      Access pattern for presigned URLs:\n                           adobeTarget (7 days), system (48 hours), user (action URLs)\n  --environment=<env>    Environment (staging/production)\n  --timeout=<seconds>    Request timeout override\n\nLegacy Format (still supported):\n  action=<name>          Same as --action=<name>\n  useCase=<type>         Same as --use-case=<type>\n\nExamples:\n  npm run test:get-products:target\n  npm run test:action --action=get-products --use-case=adobeTarget\n  npm run test:action action=get-products useCase=system\n'
  );
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
