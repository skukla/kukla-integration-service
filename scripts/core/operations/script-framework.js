/**
 * Scripts Core Framework Operations
 * Shared script execution framework used across all script domains
 */

const format = require('../../format');

/**
 * Execute a script with consistent error handling and output formatting
 * @param {string} scriptName - Name of the script being executed
 * @param {Function} scriptFunction - The script function to execute
 * @param {Array} args - Command line arguments
 * @returns {Promise<Object>} Execution result
 */
async function executeScript(scriptName, scriptFunction, args) {
  try {
    const result = await scriptFunction(args);
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error(format.error(`${scriptName} failed: ${error.message}`));

    if (process.env.NODE_ENV === 'development' || args.includes('--verbose')) {
      console.error(format.muted('Stack trace:'));
      console.error(format.muted(error.stack));
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse command line arguments into an object
 * @param {Array} args - Raw command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs(args) {
  const parsed = { _: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      parsed[key] = value || true;
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      parsed[key] = true;
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

module.exports = {
  executeScript,
  parseArgs,
};
