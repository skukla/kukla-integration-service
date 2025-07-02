const chalk = require('chalk');

const { updateMeshWithRetry, runCommand } = require('./lib/mesh-utils');

async function main() {
  const isProd = process.argv.includes('--prod');
  const environment = isProd ? 'production' : 'staging';

  console.log(chalk.bold.cyan(`\n🚀 Starting API Mesh update for ${environment} environment...\n`));

  try {
    // Build mesh configuration first
    await runCommand('npm run build:config', {
      spinnerText: 'Building mesh configuration...',
      successText: 'Built mesh configuration',
    });

    // Use shared mesh update helper with optimized timing
    const success = await updateMeshWithRetry({ isProd });

    if (success) {
      console.log(chalk.bold.green('🎉 Mesh update completed successfully!\n'));
      process.exit(0);
    } else {
      console.log(chalk.bold.red('❌ Mesh update failed. Please check the output above.\n'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\nScript failed. Please see the error messages above.'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
