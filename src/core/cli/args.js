/**
 * Command-line argument parsing utilities
 * @module core/cli/args
 */

/**
 * Parse command line arguments into a structured object
 * @param {string[]} args - Raw command line arguments (process.argv.slice(2))
 * @param {Object} options - Parser options
 * @param {Object} options.flags - Flag definitions with default values
 * @returns {Object} Parsed arguments
 */
function parseArgs(args, options = {}) {
  const result = {
    ...options.flags,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const flag = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        result[flag] = nextArg;
        i++; // Skip next arg since we used it as value
      } else {
        result[flag] = true;
      }
    }
  }

  return result;
}

module.exports = {
  parseArgs,
};
