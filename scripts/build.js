#!/usr/bin/env node

/**
 * Main Build Script
 * Entry point for build operations
 */

const { outputTemplates } = require('./build/operations');
const core = require('./core');

async function main() {
  const args = core.parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run build [options]

Options:
  --help        Show this help message
  --verbose     Enable verbose output
    `);
    return;
  }

  console.log(outputTemplates.buildStartEmphasis());

  try {
    const { frontendGenerationWorkflow } = require('./build/workflows');
    await frontendGenerationWorkflow({ verbose: args.verbose });

    console.log(outputTemplates.buildComplete());
  } catch (error) {
    console.error(core.formatting.error(`Build failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(core.formatting.error(`Script execution failed: ${error.message}`));
    process.exit(1);
  });
}
