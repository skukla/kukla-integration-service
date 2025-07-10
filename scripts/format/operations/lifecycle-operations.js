/**
 * Format Domain Lifecycle Operations
 * Mid-level operations for script lifecycle management
 * Domain operations used by workflow orchestrator
 * Shared infrastructure used across all script domains
 */

const templates = require('./templates');

/**
 * Determine template type based on operation
 * Domain operation - maps operation names to template types
 * @param {string} operation - Operation name
 * @returns {Promise<string>} Template type
 */
async function determineTemplateType(operation) {
  if (operation === 'build') {
    return 'build';
  } else if (operation === 'deploy' || operation === 'deployment') {
    return 'deploy';
  } else if (operation === 'test') {
    return 'test';
  }

  // Fallback to generic template
  return 'generic';
}

/**
 * Generate start message using appropriate domain template
 * Domain operation - calls template operations based on type and emphasis
 * @param {string} templateType - Template type
 * @param {string} target - Target context
 * @param {boolean} emphasis - Use emoji emphasis
 * @returns {Promise<string>} Formatted start message
 */
async function generateStartMessage(templateType, target, emphasis) {
  if (emphasis) {
    return templates.scriptStartTemplate(templateType, target);
  }

  // Use domain-specific templates for non-emphasis formatting
  if (templateType === 'build') {
    return templates.build.start();
  } else if (templateType === 'deploy') {
    return templates.deploy.start(target);
  } else if (templateType === 'test') {
    return templates.test.start(target);
  }

  // Fallback to generic template
  return templates.scriptStartTemplate(templateType, target);
}

/**
 * Generate completion message using appropriate domain template
 * Domain operation - calls template operations based on type and emphasis
 * @param {string} templateType - Template type
 * @param {string} target - Target context
 * @param {boolean} emphasis - Use emoji emphasis
 * @returns {Promise<string>} Formatted completion message
 */
async function generateCompleteMessage(templateType, target, emphasis) {
  if (emphasis) {
    return templates.scriptCompleteTemplate(templateType, target);
  }

  // Use domain-specific templates for non-emphasis formatting
  if (templateType === 'build') {
    return templates.build.complete();
  } else if (templateType === 'deploy') {
    return templates.deploy.complete(target);
  } else if (templateType === 'test') {
    return templates.test.complete(target);
  }

  // Fallback to generic template
  return templates.scriptCompleteTemplate(templateType, target);
}

module.exports = {
  determineTemplateType,
  generateStartMessage,
  generateCompleteMessage,
};
