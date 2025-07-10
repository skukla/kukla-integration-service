/**
 * Format Domain Operations
 * Mid-level formatting operations shared across all script domains
 * Clean encapsulation with structured exports only
 */

const lifecycleOperations = require('./lifecycle-operations');
const messages = require('./messages');
const templates = require('./templates');

module.exports = {
  // Structured exports for organized access
  messages,
  templates,
  lifecycleOperations,

  // Commonly used operations for convenience (no circular spreading)
  sectionHeader: messages.sectionHeader,
  subsectionHeader: messages.subsectionHeader,
  completion: messages.completion,
  finalSuccess: messages.finalSuccess,

  scriptStartTemplate: templates.scriptStartTemplate,
  scriptCompleteTemplate: templates.scriptCompleteTemplate,
  formatEnvironment: templates.formatEnvironment,

  determineTemplateType: lifecycleOperations.determineTemplateType,
  generateStartMessage: lifecycleOperations.generateStartMessage,
  generateCompleteMessage: lifecycleOperations.generateCompleteMessage,
};
