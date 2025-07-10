/**
 * Format Domain Script Lifecycle Workflow
 * High-level formatting workflows for script lifecycle management
 * Follows clean orchestrator pattern with SINGLE orchestration function
 * Shared infrastructure used across all script domains
 */

const {
  determineTemplateType,
  generateStartMessage,
  generateCompleteMessage,
} = require('../operations');

/**
 * Script lifecycle workflow following clean orchestrator pattern
 * SINGLE ORCHESTRATION FUNCTION - delegates all work to operations layer
 * @param {Object} context - Workflow context
 * @param {string} context.operation - Operation name (build, deploy, test)
 * @param {string} context.target - Target context (environment, test type, etc.)
 * @param {boolean} context.emphasis - Use emoji emphasis
 * @returns {Object} Lifecycle workflow result with start/complete functions
 */
async function scriptLifecycleWorkflow(context = {}) {
  const { operation, target, emphasis = true } = context;
  const steps = [];

  // Step 1: Determine operation template type (delegate to operations)
  const templateType = await determineTemplateType(operation);
  steps.push(`Determined template type: ${templateType}`);

  // Step 2: Generate start message (delegate to operations)
  const startMessage = await generateStartMessage(templateType, target, emphasis);
  steps.push(`Generated start message for ${operation}`);

  // Step 3: Generate completion message (delegate to operations)
  const completeMessage = await generateCompleteMessage(templateType, target, emphasis);
  steps.push(`Generated completion message for ${operation}`);

  // Single return point with workflow result
  return {
    start: () => startMessage,
    complete: () => completeMessage,
    steps,
    operation,
    target,
    emphasis,
  };
}

module.exports = {
  scriptLifecycleWorkflow,
};
