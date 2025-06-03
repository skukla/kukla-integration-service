/**
 * Action step tracking utilities
 * @module core/steps
 */

/**
 * Creates a new step context for tracking action execution
 * @param {string} actionName - Name of the action being tracked
 * @returns {Object} Step context
 */
function createStepContext() {
  return {
    steps: [],
  };
}

/**
 * Records a step in the step context
 * @param {Object} context - Step context
 * @param {string} stepName - Name of the step
 * @param {Object} stepData - Additional step data
 */
function recordStep(context, stepName, stepData = {}) {
  context.steps.push({
    name: stepName,
    status: 'success',
    ...stepData,
  });
}

/**
 * Records an error step in the step context
 * @param {Object} context - Step context
 * @param {string} stepName - Name of the step
 * @param {Error} error - Error that occurred
 * @param {Object} stepData - Additional step data
 */
function recordErrorStep(context, stepName, error, stepData = {}) {
  context.steps.push({
    name: stepName,
    status: 'error',
    error: error.message,
    ...stepData,
  });
}

/**
 * Gets the current steps from the context
 * @param {Object} context - Step context
 * @returns {Array} Array of steps
 */
function getSteps(context) {
  return context.steps;
}

module.exports = {
  createStepContext,
  recordStep,
  recordErrorStep,
  getSteps,
};
