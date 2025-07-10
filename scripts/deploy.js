/**
 * Main Deployment Script
 * Entry point for deployment operations
 */

const core = require('./core');
const { outputTemplates } = require('./deploy/operations');

async function main() {
  const args = core.parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run deploy [options]

Options:
  --help              Show this help message
  --mesh-only         Deploy only the API Mesh (skip app deployment)
  --environment=ENV   Target environment (staging/production)
  --verbose           Enable verbose output
    `);
    return;
  }

  const operation = args['mesh-only'] ? 'mesh deployment' : 'application deployment';
  const environment =
    args.environment || core.detectScriptEnvironment({}, { allowCliDetection: true });

  console.log(outputTemplates.scriptStartEmphasis(operation, environment));

  try {
    if (args['mesh-only']) {
      const { meshDeploymentWorkflow } = require('./deploy/workflows');
      await meshDeploymentWorkflow({ environment, verbose: args.verbose });
    } else {
      const { appDeploymentWorkflow } = require('./deploy/workflows');
      await appDeploymentWorkflow({ environment, verbose: args.verbose });
    }

    console.log(outputTemplates.scriptCompleteEmphasis(operation, environment));
  } catch (error) {
    console.error(core.formatting.error(`Deployment failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(core.formatting.error(`Script execution failed: ${error.message}`));
    process.exit(1);
  });
}
