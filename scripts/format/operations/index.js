/**
 * Format Domain Operations
 * Mid-level formatting operations shared across all script domains
 * Clean encapsulation with structured exports only
 *
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

  // Script lifecycle operations (CONSOLIDATED)
  scriptStart: messages.scriptStart,
  scriptEnd: messages.scriptEnd,

  // Mesh operations (CONSOLIDATED)
  meshUpdateStart: messages.meshUpdateStart,
  meshPollingStart: messages.meshPollingStart,
  meshStartEmphasis: messages.meshStartEmphasis,
  meshCompleteEmphasis: messages.meshCompleteEmphasis,

  // Template operations
  scriptStartTemplate: templates.scriptStartTemplate,
  scriptCompleteTemplate: templates.scriptCompleteTemplate,
  formatEnvironment: templates.formatEnvironment,

  // Lifecycle operations
  determineTemplateType: lifecycleOperations.determineTemplateType,
  generateStartMessage: lifecycleOperations.generateStartMessage,
  generateCompleteMessage: lifecycleOperations.generateCompleteMessage,
};
