/**
 * Core Action - Logger Setup Utilities
 * Utility functions for setting up Adobe I/O Runtime loggers
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Setup logger for action with specified configuration
 * @param {string} actionName - Name of the action for logger context
 * @param {string} logLevel - Logger level ('info', 'debug', 'warn', 'error')
 * @returns {Object} Configured logger instance
 */
function setupLogger(actionName, logLevel = 'info') {
  return Core.Logger(actionName, { level: logLevel });
}

module.exports = {
  setupLogger,
};
