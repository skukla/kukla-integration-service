/**
 * Test Orchestration Workflow
 * Unified test workflow that handles all command routing and argument parsing
 * Provides clean interface similar to build and deploy workflows
 */

const actionTesting = require('./action-testing');
// const apiTesting = require('./api-testing'); // Not yet implemented
// const performanceTesting = require('./performance-testing'); // Not yet implemented

/**
 * Parse test-specific arguments (command, target, params)
 * Internal parsing for the test domain
 */
function parseTestArgs(rawArgs) {
  const command = rawArgs[0]; // 'action', 'api', 'performance'
  const target = rawArgs[1]; // action name, etc.

  // Parse key=value parameters
  const params = {};
  const options = {
    rawOutput: rawArgs.includes('--raw'),
    verbose: rawArgs.includes('--verbose'),
  };

  // Extract parameters in key=value format
  rawArgs.slice(2).forEach((arg) => {
    if (arg.includes('=') && !arg.startsWith('--')) {
      const [key, ...valueParts] = arg.split('=');
      const value = valueParts.join('=');

      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    }
  });

  return { command, target, params, options };
}

/**
 * Unified test workflow that routes to appropriate testing domain
 * @param {Object} options - Test options from script framework
 * @param {Array} options.args - Raw CLI arguments
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @param {boolean} options.verbose - Verbose output
 * @returns {Promise<Object>} Test result
 */
async function testOrchestrationWorkflow(options = {}) {
  const { args = [], rawOutput = false, verbose = false } = options;

  try {
    // Parse test-specific arguments
    const { command, target, params, options: parsedOptions } = parseTestArgs(args);

    // Merge options from script framework and parsed options
    const mergedOptions = {
      rawOutput: rawOutput || parsedOptions.rawOutput,
      verbose: verbose || parsedOptions.verbose,
    };

    if (!command) {
      return {
        success: false,
        error: 'Command is required',
        availableCommands: ['action', 'api', 'performance'],
        message: 'Available commands: action, api, performance',
      };
    }

    let result;

    // Route to appropriate testing workflow
    switch (command) {
      case 'action':
        if (!target) {
          const actions = actionTesting.getAvailableActions();
          return {
            success: false,
            error: 'Action name is required',
            availableActions: actions,
            message: `Action name is required. Available actions: ${actions.join(', ')}`,
          };
        }

        result = await actionTesting.actionTestingWorkflow(target, {
          params,
          rawOutput: mergedOptions.rawOutput,
        });

        // Handle raw output special case
        if (mergedOptions.rawOutput && result.rawResponse) {
          console.log(JSON.stringify(result.rawResponse, null, 2));
          return {
            success: true,
            command,
            target,
            rawOutput: true,
            message: 'Raw test output displayed',
          };
        }

        return {
          success: result.success,
          command,
          target,
          actionUrl: result.actionUrl,
          environment: result.environment,
          status: result.status,
          statusText: result.statusText,
          message: `Action ${target} tested successfully`,
        };

      case 'api':
        return {
          success: false,
          error: 'API testing not yet implemented',
          command,
          message: 'API testing not yet implemented in domain structure',
        };

      case 'performance':
        return {
          success: false,
          error: 'Performance testing not yet implemented',
          command,
          target,
          message: 'Performance testing not yet implemented in domain structure',
        };

      default:
        return {
          success: false,
          error: `Unknown command: ${command}`,
          command,
          availableCommands: ['action', 'api', 'performance'],
          message: `Unknown command: ${command}. Available: action, api, performance`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Test orchestration failed: ${error.message}`,
    };
  }
}

module.exports = {
  testOrchestrationWorkflow,
  parseTestArgs,
};
