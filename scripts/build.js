#!/usr/bin/env node

/**
 * Main Build Script
 * Entry point for build operations
 */

const format = require('./core/formatting');
const { parseArgs, executeScriptWithExit } = require('./core/operations/script-framework');

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run build:* [options]

Options:
  --help          Show this help message
  --config-only   Generate frontend config only
  --mesh-only     Generate mesh resolver only


Note: For full deployment, use 'npm run deploy'
    `);
    return;
  }

  // Use format domain facade for clean logging
  const target = args['config-only'] ? 'config' : args['mesh-only'] ? 'mesh' : '';

  if (!target) {
    console.log(format.warning('No build target specified. Use --config-only or --mesh-only'));
    console.log('For full deployment, use: npm run deploy');
    return;
  }

  console.log(format.success('Build started'));

  try {
    if (args['config-only']) {
      // Frontend config generation only
      const { frontendGenerationWorkflow } = require('./build/workflows');
      await frontendGenerationWorkflow({});
    } else if (args['mesh-only']) {
      // Mesh resolver generation only
      const { meshGenerationWorkflow } = require('./build/workflows');
      await meshGenerationWorkflow({});
    }

    console.log(format.success('Build completed'));
  } catch (error) {
    console.log(format.error(`Build failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  executeScriptWithExit('build', main);
}
