/**
 * Script Framework Operations
 * Provides createScript framework similar to actions' createAction pattern
 */

const core = require('../');

/**
 * Create a script with clean business logic separation
 * @param {Function} businessLogic - Pure business logic function
 * @param {Object} config - Script configuration
 * @returns {Object} Script with main function and business logic exposed
 */
function createScript(businessLogic, config) {
  const { scriptName, domains = [], description = '', cliOptions = {}, examples = [] } = config;

  /**
   * Main script entry point with infrastructure handling
   */
  async function main(rawArgs = process.argv.slice(2)) {
    try {
      // Parse CLI arguments
      const args = parseCliArgs(rawArgs, cliOptions);

      if (args.help) {
        showUsage(scriptName, description, cliOptions, examples);
        process.exit(0);
      }

      // Create context with domains
      const context = await createScriptContext(domains, args);

      // Execute business logic
      const result = await businessLogic(context);

      // Handle result
      if (result.success) {
        if (result.message) {
          console.log(`✅ ${result.message}`);
        }
        if (result.data && result.data.environment) {
          console.log(`📍 Environment: ${result.data.environment}`);
        }
        process.exit(0);
      } else {
        const errorMessage = result.message || 'Operation failed';
        console.error(`❌ ${errorMessage}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ ${scriptName} failed: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  return {
    main,
    businessLogic,
    config: {
      scriptName,
      domains,
      description,
      cliOptions,
    },
  };
}

/**
 * Parse CLI arguments with consistent options
 */
function parseCliArgs(args, customOptions = {}) {
  const defaultOptions = {
    help: {
      flags: ['--help', '-h'],
      description: 'Show this help message',
    },
  };

  const allOptions = { ...defaultOptions, ...customOptions };
  const parsed = { help: false };

  // Check for help flags first
  if (args.some((arg) => allOptions.help.flags.includes(arg))) {
    parsed.help = true;
    return parsed;
  }

  // Parse custom options
  Object.entries(customOptions).forEach(([key, option]) => {
    if (option.flags) {
      parsed[key] = args.some((arg) => option.flags.includes(arg));
    }
  });

  // Extract any remaining args
  parsed.args = args.filter(
    (arg) => !Object.values(allOptions).some((option) => option.flags && option.flags.includes(arg))
  );

  return parsed;
}

/**
 * Create script context with domain workflows
 */
async function createScriptContext(domains, args) {
  const context = {
    core: core.format,
    args,
  };

  // Load domain workflows based on requirements
  if (domains.includes('build')) {
    const buildDomain = require('../../build/');
    context.build = buildDomain.workflows;
  }

  if (domains.includes('deploy')) {
    const deployDomain = require('../../deploy/');
    context.deploy = deployDomain.workflows;
  }

  if (domains.includes('test')) {
    const testDomain = require('../../test/');
    context.test = testDomain;
  }

  return context;
}

/**
 * Show usage information
 */
function showUsage(scriptName, description, cliOptions, examples) {
  console.log(`Usage: npm run ${scriptName} [options]`);

  if (description) {
    console.log('');
    console.log(description);
  }

  console.log('');
  console.log('Options:');

  Object.entries(cliOptions).forEach(([key, option]) => {
    const flags = option.flags ? option.flags.join(', ') : `--${key}`;
    const desc = option.description || `Enable ${key}`;
    console.log(`  ${flags.padEnd(25)} ${desc}`);
  });

  // Always show help option
  console.log('  --help, -h'.padEnd(27) + 'Show this help message');

  if (examples.length > 0) {
    console.log('');
    console.log('Examples:');
    examples.forEach((example) => {
      console.log(`  ${example}`);
    });
  }
}

/**
 * Create success response for scripts
 */
function success(data = {}, message = '') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create error response for scripts
 */
function error(message, data = {}) {
  return {
    success: false,
    message,
    data,
  };
}

module.exports = {
  createScript,
  success,
  error,
};
