const { spawn } = require('child_process');

const chalk = require('chalk');
const ora = require('ora');

function runCommand(command, { isInteractive = false, spinnerText, successText }) {
  const spinner = ora(spinnerText).start();

  return new Promise((resolve, reject) => {
    if (isInteractive) {
      spinner.stop();
      console.log(chalk.blue(`\n▶️ Running interactive command: ${command}`));
      console.log(chalk.yellow('Please follow the prompts from the command below.\n'));
    }

    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: isInteractive ? 'inherit' : 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    if (!isInteractive) {
      child.stdout.on('data', (data) => (stdout += data.toString()));
      child.stderr.on('data', (data) => (stderr += data.toString()));
    }

    child.on('close', (code) => {
      if (code !== 0) {
        spinner.fail(chalk.red(`Error: Command failed with exit code ${code}`));
        if (!isInteractive) console.error(chalk.red(stderr));
        reject(new Error(stderr));
      } else {
        spinner.succeed(chalk.green(successText || spinnerText));
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      spinner.fail(chalk.red(`Failed to start command: ${command}`));
      console.error(err);
      reject(err);
    });
  });
}

async function main() {
  const isProd = process.argv.includes('--prod');
  const environment = isProd ? 'production' : 'staging';
  const pollIntervalSeconds = isProd ? 60 : 30; // Longer intervals for production
  const maxPollAttempts = isProd ? 10 : 6; // More attempts for production (10 min vs 3 min)

  console.log(chalk.bold.cyan(`\n🚀 Starting API Mesh update for ${environment} environment...\n`));

  try {
    await runCommand('npm run build:config', {
      spinnerText: 'Building mesh configuration...',
      successText: 'Built mesh configuration',
    });

    const updateCommand = `aio api-mesh:update mesh.json${isProd ? ' --ignoreCache' : ''} --autoConfirmAction`;
    await runCommand(updateCommand, {
      isInteractive: isProd,
      spinnerText: `Updating API Mesh in ${environment}...`,
      successText: `Sent update command to API Mesh in ${environment}`,
    });
    console.log(chalk.blue('\nUpdate command sent. Mesh is provisioning...'));

    // Poll status until completion or timeout
    let pollAttempt = 1;
    let lastStatus = '';

    while (pollAttempt <= maxPollAttempts) {
      const waitSpinner = ora(
        `Waiting ${pollIntervalSeconds}s before status check ${pollAttempt}/${maxPollAttempts}...`
      ).start();
      await new Promise((resolve) => setTimeout(resolve, pollIntervalSeconds * 1000));
      waitSpinner.succeed(chalk.green('Wait complete'));

      const statusOutput = await runCommand('aio api-mesh:status', {
        spinnerText: `Checking mesh status (${pollAttempt}/${maxPollAttempts})...`,
        successText: `Checked mesh status (${pollAttempt}/${maxPollAttempts})`,
      });

      lastStatus = statusOutput.toLowerCase();

      console.log(chalk.cyan('\n------------------- MESH STATUS -------------------\n'));
      console.log(chalk.white(statusOutput.trim()));
      console.log(chalk.cyan('\n-------------------------------------------------\n'));

      if (lastStatus.includes('success')) {
        console.log(chalk.bold.green('✅ API Mesh update successful!\n'));
        return;
      } else if (lastStatus.includes('error') || lastStatus.includes('failed')) {
        console.log(chalk.red(`❌ Mesh update failed with error. Status: ${lastStatus.trim()}`));
        process.exit(1);
      } else {
        // Still in progress (provisioning, updating, etc.)
        console.log(chalk.yellow(`⏳ Mesh still updating... (${lastStatus.trim()})`));
        pollAttempt++;
      }
    }

    // If we're here, we hit max polls
    console.log(
      chalk.yellow(`⏱️  Mesh update timed out after ${maxPollAttempts * pollIntervalSeconds}s`)
    );
    console.log(
      chalk.bold.yellow('⚠️  Please check mesh status manually with: aio api-mesh:status\n')
    );
  } catch (error) {
    console.error(chalk.red('\nScript failed. Please see the error messages above.'));
    process.exit(1);
  }
}

main();
