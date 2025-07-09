/**
 * Testing Validation Operations
 * Shared validation logic for all testing workflows
 */

/**
 * Validate required parameter is present
 * @param {string} param - Parameter value
 * @param {string} paramName - Parameter name for error message
 * @param {Array<string>} availableOptions - Available options for error message
 * @returns {Object|null} Error object or null if valid
 */
function validateRequiredParam(param, paramName, availableOptions = []) {
  if (!param) {
    return {
      success: false,
      error: `${paramName} is required`,
      availableOptions,
      message:
        availableOptions.length > 0
          ? `${paramName} is required. Available ${paramName.toLowerCase()}s: ${availableOptions.join(', ')}`
          : `${paramName} is required`,
    };
  }
  return null;
}

/**
 * Validate parameter is in allowed list
 * @param {string} param - Parameter value
 * @param {string} paramName - Parameter name for error message
 * @param {Array<string>} allowedValues - Allowed values
 * @returns {Object|null} Error object or null if valid
 */
function validateParamInList(param, paramName, allowedValues) {
  if (!allowedValues.includes(param)) {
    return {
      success: false,
      error: `Unknown ${paramName.toLowerCase()}: ${param}`,
      availableOptions: allowedValues,
      message: `Unknown ${paramName.toLowerCase()}: ${param}. Available: ${allowedValues.join(', ')}`,
    };
  }
  return null;
}

/**
 * Validate API testing inputs
 * @param {string} endpoint - Endpoint to test
 * @param {Array<string>} availableEndpoints - Available endpoints
 * @returns {Object|null} Validation result
 */
function validateApiTestingInputs(endpoint, availableEndpoints) {
  // Check required parameter
  const requiredCheck = validateRequiredParam(endpoint, 'Endpoint', availableEndpoints);
  if (requiredCheck) return requiredCheck;

  // Check parameter in allowed list
  return validateParamInList(endpoint, 'Endpoint', availableEndpoints);
}

/**
 * Validate performance testing inputs
 * @param {string} scenarioName - Scenario to test
 * @param {Array<string>} availableScenarios - Available scenarios
 * @returns {Object|null} Validation result
 */
function validatePerformanceTestingInputs(scenarioName, availableScenarios) {
  // Check required parameter
  const requiredCheck = validateRequiredParam(scenarioName, 'Scenario name', availableScenarios);
  if (requiredCheck) return requiredCheck;

  // Check parameter in allowed list
  return validateParamInList(scenarioName, 'Scenario', availableScenarios);
}

/**
 * Validate test orchestration inputs
 * @param {string} command - Command to execute
 * @param {Array<string>} availableCommands - Available commands
 * @returns {Object|null} Validation result
 */
function validateTestOrchestrationInputs(command, availableCommands) {
  // Check required parameter
  const requiredCheck = validateRequiredParam(command, 'Command', availableCommands);
  if (requiredCheck) return requiredCheck;

  // Check parameter in allowed list
  return validateParamInList(command, 'Command', availableCommands);
}

module.exports = {
  validateRequiredParam,
  validateParamInList,
  validateApiTestingInputs,
  validatePerformanceTestingInputs,
  validateTestOrchestrationInputs,
};
