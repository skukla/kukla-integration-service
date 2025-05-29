import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import ora from 'ora';
import kill from 'tree-kill';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PID_FILE = path.join(__dirname, '..', '.pid');

function execCommand(command) {
  return execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
}

async function cleanupProcesses() {
  const spinner = ora('Cleaning up existing processes').start();
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf-8');
      try {
        kill(parseInt(pid));
      } catch (e) {
        // Process may not exist anymore
      }
      fs.unlinkSync(PID_FILE);
    }
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to cleanup processes: ${error.message}`);
    throw error;
  }
}

async function cleanupArtifacts() {
  const spinner = ora('Cleaning up artifacts').start();
  try {
    execCommand('rm -rf .tmp dist');
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to cleanup artifacts: ${error.message}`);
    throw error;
  }
}

async function generateConfig() {
  const spinner = ora('Generating runtime configuration').start();
  try {
    execCommand('npm run predev');
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to generate config: ${error.message}`);
    throw error;
  }
}

// async function buildActions() {
//   const spinner = ora('Building actions').start();
//   try {
//     execCommand('aio app build --no-web-assets');
//     spinner.succeed();
//   } catch (error) {
//     spinner.fail(`Failed to build actions: ${error.message}`);
//     throw error;
//   }
// }

async function startServer() {
  let currentSpinner = ora('Starting development server').start();
  return new Promise((resolve, reject) => {
    const server = spawn('aio', ['app', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Save PID for later cleanup
    fs.writeFileSync(PID_FILE, server.pid.toString());

    let output = '';
    let serverStarted = false;
    let urlsShown = false;

    server.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      // Only show non-empty lines
      chunk.split('\n').forEach((line) => {
        if (line.trim()) {
          // Look for URLs in the output
          if (line.includes('http')) {
            console.log('🔗', line.trim());
          } else if (!line.includes('watching') && !line.includes('bundling')) {
            // Filter out noisy watch/bundle messages
            console.log(line.trim());
          }
        }
      });

      // Look for action URLs
      if (chunk.includes('Action URLs:') && !urlsShown) {
        urlsShown = true;
        currentSpinner.succeed('Development server started');
        console.log('\n🎯 Available Actions:');
      }

      // Check for server ready
      if (chunk.includes('press CTRL+C to terminate') && !serverStarted) {
        serverStarted = true;
        if (!urlsShown) {
          currentSpinner.succeed('Development server started');
        }
        console.log('\n👉 Press Ctrl+C to stop the server\n');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.error(chunk);
    });

    server.on('error', (error) => {
      currentSpinner.fail();
      reject(new Error(`Failed to start server: ${error.message}\nOutput: ${output}`));
    });

    // Add timeout
    setTimeout(() => {
      if (!serverStarted) {
        currentSpinner.fail();
        kill(server.pid);
        reject(new Error(`Timeout waiting for server\nServer logs:\n${output}`));
      }
    }, 30000);
  });
}

async function main() {
  console.log('🚀 Starting API server...\n');

  try {
    await cleanupProcesses();
    await cleanupArtifacts();
    await generateConfig();
    // await buildActions();
    const server = await startServer();

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down server...');
      kill(server.pid);
      process.exit(0);
    });
  } catch (error) {
    console.error(`\n❌ Error starting API server: ${error.message}`);
    process.exit(1);
  }
}

main();
