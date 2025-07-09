/**
 * Test Orchestration Workflow
 * Clean orchestration following refactoring standards
 */

const { validation, execution, formatting } = require('../operations');

/**
 * Test orchestration workflow - clean orchestrator
 * @param {Object} options - Test options from script framework
 * @returns {Promise<Object>} Test result
 */
async function testOrchestrationWorkflow(options = {}) {
  const { args = [], rawOutput = false, verbose = false } = options;

  try {
    // Step 1: Parse arguments (calls operation)
    const {
      command,
      target,
      params,
      options: parsedOptions,
    } = execution.parseTestCommandArgs(args);
    const mergedOptions = {
      rawOutput: rawOutput || parsedOptions.rawOutput,
      verbose: verbose || parsedOptions.verbose,
    };

    // Step 2: Validate command (calls operation)
    const validationResult = validation.validateTestOrchestrationInputs(command, [
      'action',
      'api',
      'performance',
    ]);
    if (validationResult) return validationResult;

    // Step 3: Route to appropriate workflow (calls operation)
    const result = await execution.routeTestCommand(command, target, params, mergedOptions);

    // Step 4: Handle raw output (calls operation)
    const rawOutputResult = formatting.handleRawOutput(
      mergedOptions.rawOutput,
      result,
      command,
      target
    );
    if (rawOutputResult) return rawOutputResult;

    // Step 5: Format final response (calls operation)
    return formatting.formatTestResponse(result, command, command, target);
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
};
