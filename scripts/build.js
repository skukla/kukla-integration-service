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
Usage: npm run build:* [options]

Options:
  --help          Show this help message
  --config-only   Generate frontend config only
  --mesh-only     Generate mesh resolver only
  --verbose       Enable verbose output

Note: For full deployment, use 'npm run deploy'
    `);
    return;
  }

  console.log(outputTemplates.buildStartEmphasis());

  try {
    if (args['config-only']) {
      // Frontend config generation only
      const { frontendGenerationWorkflow } = require('./build/workflows');
      await frontendGenerationWorkflow({ verbose: args.verbose });
    } else if (args['mesh-only']) {
      // Mesh resolver generation only
      const { meshGenerationWorkflow } = require('./build/workflows');
      await meshGenerationWorkflow({ verbose: args.verbose });
    } else {
      console.log(
        core.formatting.warning('No build target specified. Use --config-only or --mesh-only')
      );
      console.log('For full deployment, use: npm run deploy');
      return;
    }

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
